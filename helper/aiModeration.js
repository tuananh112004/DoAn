const axios = require('axios');

// Cache đơn giản để lưu kết quả moderation
const moderationCache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 giờ

// Thống kê API usage
let apiStats = {
  totalCalls: 0,
  successfulCalls: 0,
  rateLimitHits: 0,
  fallbackUsage: 0,
  cacheHits: 0
};

// Hàm kiểm tra nội dung comment bằng AI
async function moderateComment(content) {
  apiStats.totalCalls++;
  
  // Tạo key cache từ nội dung
  const cacheKey = content.toLowerCase().trim();
  
  // Kiểm tra cache
  if (moderationCache.has(cacheKey)) {
    const cached = moderationCache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      console.log("Using cached moderation result");
      apiStats.cacheHits++;
      return cached.result;
    }
  }
  
  const maxRetries = 3;
  const baseDelay = 1000; // 1 giây
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt} to call OpenAI API...`);
      
      // Sử dụng OpenAI API để kiểm tra nội dung
      const response = await axios.post('https://api.openai.com/v1/moderations', {
        model: "omni-moderation-latest",
        input: content
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000 // 15 giây timeout
      });
      
      const result = response.data.results[0];
      
      // Kiểm tra các flag vi phạm
      const flags = result.flags;
      const categories = result.categories;
      
      // Danh sách các loại vi phạm cần kiểm tra
      const violationTypes = [
        'hate', 'hate/threatening', 'self-harm', 'sexual', 
        'sexual/minors', 'violence', 'violence/graphic'
      ];
      
      let hasViolation = false;
      let violationType = null;
      
      // Kiểm tra từng loại vi phạm
      for (const type of violationTypes) {
        if (categories[type] === true) {
          hasViolation = true;
          violationType = type;
          break;
        }
      }
      
      const moderationResult = {
        isViolation: hasViolation,
        violationType: violationType,
        flagged: result.flagged,
        categories: categories,
        scores: result.category_scores,
        source: 'openai'
      };
      
      // Lưu vào cache
      moderationCache.set(cacheKey, {
        result: moderationResult,
        timestamp: Date.now()
      });
      
      apiStats.successfulCalls++;
      console.log("OpenAI API call successful");
      
      return moderationResult;
      
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error.response?.status, error.response?.data?.error?.message);
      
      // Xử lý lỗi rate limit
      if (error.response?.status === 429) {
        apiStats.rateLimitHits++;
        const retryAfter = parseInt(error.response.headers['retry-after']) || baseDelay * attempt;
        console.log(`Rate limit hit (Too Many Requests). Retrying after ${retryAfter}ms...`);
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryAfter));
          continue;
        } else {
          console.log("Max retries reached. Using fallback moderation.");
          break;
        }
      }
      
      // Xử lý các lỗi khác
      if (attempt === maxRetries) {
        console.error("All attempts failed. Using fallback moderation.");
        break;
      }
      
      // Chờ một chút trước khi thử lại với exponential backoff
      const delay = baseDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // Fallback nếu tất cả đều thất bại
  console.log("Using fallback moderation");
  apiStats.fallbackUsage++;
  return fallbackModeration(content);
}

// Fallback moderation khi không có API key hoặc lỗi
function fallbackModeration(content) {
  console.log("Using fallback moderation for:", content.substring(0, 50) + "...");
  
  const bannedWords = [
    // 🔞 Chửi tục tiếng Việt (có dấu)
    'địt', 'đụ', 'lồn', 'cặc', 'đéo', 'đcm', 'vãi l*n', 'vãi lồn', 'vcl', 'loz', 'clgt',
    'má mày', 'mẹ mày', 'đồ ngu', 'óc chó', 'não chó', 'ngu vãi', 'ngu như bò', 'ngu như lợn',
  
    // 🔞 Chửi tục tiếng Việt (không dấu/lách luật)
    'dit', 'du', 'lon', 'cac', 'deo', 'dcm', 'vl', 'loz', 'oc cho', 'oc lon', 'oc heo', 'dm', 'cl',
  
    // 🔞 Chửi tục tiếng Anh
    'fuck', 'shit', 'bitch', 'asshole', 'dick', 'pussy', 'bastard', 'slut', 'faggot', 'moron',
  
    // 🚫 Spam, lừa đảo, gian lận
    'spam', 'scam', 'lừa đảo', 'lừa gạt', 'gian thương', 'bịp bợm', 'treo đầu dê', 'bán thịt chó', 'hàng fake', 'hàng giả', 'đạo nhái',
  
    // 👎 Chê bai sản phẩm nặng
    'rác', 'rác rưởi', 'đồ bỏ đi', 'phế phẩm', 'đồ đểu', 'hàng lởm', 'tệ', 'quá tệ', 'cực kỳ tệ', 
    'kém chất lượng', 'không ra gì', 'không xứng đáng', 'rẻ tiền', 'không đáng tiền', 'phí tiền',
    'dở ẹc', 'chán', 'vớ vẩn', 'xấu vãi', 'xấu vãi l', 'xấu như chó', 'xấu như cc', 'xấu kinh tởm',
    'buồn nôn', 'thảm họa', 'thiết kế như đùa', 'đỉnh cao của tệ hại', 'sản phẩm của trò đùa',
    'mua 1 lần chừa cả đời', 'tiền mất tật mang', 'như cức', 'như cứt', 'như cc', 'như loz', 'như l',
    'hãm l', 'hãm vãi', 'thất vọng', 'cực kỳ thất vọng', 'khác mô tả', 'khác xa thực tế',
  
    // 🤡 Mỉa mai, châm biếm
    'siêu phẩm phế phẩm', 'best vãi', 'đỉnh thật sự', 'đỉnh của chóp (mỉa mai)', 'đỉnh cao thất bại', 
    'trò hề', 'cạn lời', 'ai mua là dại', 'đúng là trò hề', 'bán cho ai vậy trời', 'nhìn phát ói'
  ];
  
  const lowerContent = content.toLowerCase();
  let hasViolation = false;
  let violationType = null;
  
  // Kiểm tra từ khóa cấm
  for (const word of bannedWords) {
    if (lowerContent.includes(word)) {
      hasViolation = true;
      violationType = 'inappropriate_language';
      break;
    }
  }
  
  // Kiểm tra spam patterns
  if (lowerContent.length > 500 || lowerContent.split(' ').length > 100) {
    hasViolation = true;
    violationType = 'spam';
  }
  
  // Kiểm tra lặp lại ký tự
  if (/(.)\1{5,}/.test(content)) {
    hasViolation = true;
    violationType = 'spam';
  }
  
  // Kiểm tra URL spam
  const urlPattern = /(https?:\/\/[^\s]+)/g;
  const urls = content.match(urlPattern);
  if (urls && urls.length > 3) {
    hasViolation = true;
    violationType = 'spam';
  }
  
  return {
    isViolation: hasViolation,
    violationType: violationType,
    flagged: hasViolation,
    categories: {},
    scores: {},
    source: 'fallback'
  };
}

// Hàm xóa cache cũ
function cleanupCache() {
  const now = Date.now();
  for (const [key, value] of moderationCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      moderationCache.delete(key);
    }
  }
  console.log(`Cache cleaned up. Current size: ${moderationCache.size}`);
}

// Tự động cleanup cache mỗi giờ
setInterval(cleanupCache, 60 * 60 * 1000);

// Hàm reset stats
function resetStats() {
  apiStats = {
    totalCalls: 0,
    successfulCalls: 0,
    rateLimitHits: 0,
    fallbackUsage: 0,
    cacheHits: 0
  };
}

module.exports = {
  moderateComment,
  getStats: () => ({ ...apiStats }),
  resetStats,
  cleanupCache
}; 