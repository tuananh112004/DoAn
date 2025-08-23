// const axios = require('axios');

// // Cache đơn giản để lưu kết quả moderation
// const moderationCache = new Map();
// const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 giờ

// // Thống kê API usage
// let apiStats = {
//   totalCalls: 0,
//   successfulCalls: 0,
//   rateLimitHits: 0,
//   fallbackUsage: 0,
//   cacheHits: 0
// };

// // Hàm kiểm tra nội dung comment bằng AI
// async function moderateComment(content) {
//   apiStats.totalCalls++;
  
//   // Tạo key cache từ nội dung
//   const cacheKey = content.toLowerCase().trim();
  
//   // Kiểm tra cache
//   if (moderationCache.has(cacheKey)) {
//     const cached = moderationCache.get(cacheKey);
//     if (Date.now() - cached.timestamp < CACHE_TTL) {
//       console.log("Using cached moderation result");
//       apiStats.cacheHits++;
//       return cached.result;
//     }
//   }
  
//   const maxRetries = 3;
//   const baseDelay = 1000; // 1 giây
  
//   for (let attempt = 1; attempt <= maxRetries; attempt++) {
//     try {
//       console.log(`Attempt ${attempt} to call external moderation API...`);

//       // Prefer Google AI moderation endpoint if configured. Do NOT call OpenAI.
//       if (!process.env.GOOGLE_API_KEY || !process.env.GOOGLE_AI_ENDPOINT) {
//         console.log('No Google moderation endpoint configured. Skipping external moderation.');
//         break; // exit loop to fallback
//       }

//       const endpoint = process.env.GOOGLE_AI_ENDPOINT;
//       const apiKey = process.env.GOOGLE_API_KEY;

//       // Generic payload - many Google endpoints accept { input } or { content }
//       const payload = { input: content };

//       const response = await axios.post(endpoint, payload, {
//         headers: {
//           'Authorization': `Bearer ${apiKey}`,
//           'Content-Type': 'application/json'
//         },
//         timeout: 15000 // 15s
//       });

//       // Try to normalize response into expected fields
//       const data = response.data || {};
//       // Google-like shapes may vary; attempt commonly-used paths
//       const result = data.results?.[0] || data.output?.[0] || data[0] || data;

//       // If result doesn't have flag info, fallback to simple fallback moderation
//       const categories = result.categories || result.category_scores || {};
//       const flagged = result.flagged || result.flagged === true || false;

//       // Determine violation by scanning categories where true
//       const violationTypes = [
//         'hate', 'hate/threatening', 'self-harm', 'sexual', 
//         'sexual/minors', 'violence', 'violence/graphic'
//       ];
//       let hasViolation = false;
//       let violationType = null;
//       for (const type of violationTypes) {
//         if (categories[type] === true) {
//           hasViolation = true;
//           violationType = type;
//           break;
//         }
//       }

//       const moderationResult = {
//         isViolation: hasViolation,
//         violationType: violationType,
//         flagged: flagged,
//         categories: categories,
//         scores: result.category_scores || {},
//         source: 'google'
//       };

//       moderationCache.set(cacheKey, { result: moderationResult, timestamp: Date.now() });
//       apiStats.successfulCalls++;
//       console.log('External moderation call successful');
//       return moderationResult;

//     } catch (error) {
//       console.error(`Attempt ${attempt} failed:`, error.response?.status, error.response?.data || error.message || error);

//       // If rate limited by external provider, respect retry-after
//       if (error.response?.status === 429) {
//         apiStats.rateLimitHits++;
//         const retryAfter = parseInt(error.response.headers['retry-after']) || baseDelay * attempt;
//         console.log(`Rate limit hit (429). Retrying after ${retryAfter}ms...`);
//         if (attempt < maxRetries) {
//           await new Promise(resolve => setTimeout(resolve, retryAfter));
//           continue;
//         } else {
//           console.log('Max retries reached. Using fallback moderation.');
//           break;
//         }
//       }

//       if (attempt === maxRetries) {
//         console.error('All attempts failed. Using fallback moderation.');
//         break;
//       }

//       const delay = baseDelay * Math.pow(2, attempt - 1);
//       await new Promise(resolve => setTimeout(resolve, delay));
//     }
//   }
  
//   // Fallback nếu tất cả đều thất bại
//   console.log("Using fallback moderation");
//   apiStats.fallbackUsage++;
//   return fallbackModeration(content);
// }

// // Fallback moderation khi không có API key hoặc lỗi
// function fallbackModeration(content) {
//   console.log("Using fallback moderation for:", content.substring(0, 50) + "...");
  
//   const bannedWords = [
//     // 🔞 Chửi tục tiếng Việt (có dấu)
//     'địt', 'đụ', 'lồn', 'cặc', 'đéo', 'đcm', 'vãi l*n', 'vãi lồn', 'vcl', 'loz', 'clgt',
//     'má mày', 'mẹ mày', 'đồ ngu', 'óc chó', 'não chó', 'ngu vãi', 'ngu như bò', 'ngu như lợn',
  
//     // 🔞 Chửi tục tiếng Việt (không dấu/lách luật)
//     'dit', 'du', 'lon', 'cac', 'deo', 'dcm', 'vl', 'loz', 'oc cho', 'oc lon', 'oc heo', 'dm', 'cl',
  
//     // 🔞 Chửi tục tiếng Anh
//     'fuck', 'shit', 'bitch', 'asshole', 'dick', 'pussy', 'bastard', 'slut', 'faggot', 'moron',
  
//     // 🚫 Spam, lừa đảo, gian lận
//     'spam', 'scam', 'lừa đảo', 'lừa gạt', 'gian thương', 'bịp bợm', 'treo đầu dê', 'bán thịt chó', 'hàng fake', 'hàng giả', 'đạo nhái',
  
//     // 👎 Chê bai sản phẩm nặng
//     'rác', 'rác rưởi', 'đồ bỏ đi', 'phế phẩm', 'đồ đểu', 'hàng lởm', 'tệ', 'quá tệ', 'cực kỳ tệ', 
//     'kém chất lượng', 'không ra gì', 'không xứng đáng', 'rẻ tiền', 'không đáng tiền', 'phí tiền',
//     'dở ẹc', 'chán', 'vớ vẩn', 'xấu vãi', 'xấu vãi l', 'xấu như chó', 'xấu như cc', 'xấu kinh tởm',
//     'buồn nôn', 'thảm họa', 'thiết kế như đùa', 'đỉnh cao của tệ hại', 'sản phẩm của trò đùa',
//     'mua 1 lần chừa cả đời', 'tiền mất tật mang', 'như cức', 'như cứt', 'như cc', 'như loz', 'như l',
//     'hãm l', 'hãm vãi', 'thất vọng', 'cực kỳ thất vọng', 'khác mô tả', 'khác xa thực tế',
  
//     // 🤡 Mỉa mai, châm biếm
//     'siêu phẩm phế phẩm', 'best vãi', 'đỉnh thật sự', 'đỉnh của chóp (mỉa mai)', 'đỉnh cao thất bại', 
//     'trò hề', 'cạn lời', 'ai mua là dại', 'đúng là trò hề', 'bán cho ai vậy trời', 'nhìn phát ói'
//   ];
  
//   const lowerContent = content.toLowerCase();
//   let hasViolation = false;
//   let violationType = null;
  
//   // Kiểm tra từ khóa cấm
//   for (const word of bannedWords) {
//     if (lowerContent.includes(word)) {
//       hasViolation = true;
//       violationType = 'inappropriate_language';
//       break;
//     }
//   }
  
//   // Kiểm tra spam patterns
//   if (lowerContent.length > 500 || lowerContent.split(' ').length > 100) {
//     hasViolation = true;
//     violationType = 'spam';
//   }
  
//   // Kiểm tra lặp lại ký tự
//   if (/(.)\1{5,}/.test(content)) {
//     hasViolation = true;
//     violationType = 'spam';
//   }
  
//   // Kiểm tra URL spam
//   const urlPattern = /(https?:\/\/[^\s]+)/g;
//   const urls = content.match(urlPattern);
//   if (urls && urls.length > 3) {
//     hasViolation = true;
//     violationType = 'spam';
//   }
  
//   return {
//     isViolation: hasViolation,
//     violationType: violationType,
//     flagged: hasViolation,
//     categories: {},
//     scores: {},
//     source: 'fallback'
//   };
// }

// // Hàm xóa cache cũ
// function cleanupCache() {
//   const now = Date.now();
//   for (const [key, value] of moderationCache.entries()) {
//     if (now - value.timestamp > CACHE_TTL) {
//       moderationCache.delete(key);
//     }
//   }
//   console.log(`Cache cleaned up. Current size: ${moderationCache.size}`);
// }

// // Tự động cleanup cache mỗi giờ
// setInterval(cleanupCache, 60 * 60 * 1000);

// // Hàm reset stats
// function resetStats() {
//   apiStats = {
//     totalCalls: 0,
//     successfulCalls: 0,
//     rateLimitHits: 0,
//     fallbackUsage: 0,
//     cacheHits: 0
//   };
// }

// module.exports = {
//   moderateComment,
//   getStats: () => ({ ...apiStats }),
//   resetStats,
//   cleanupCache
// }; 
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

// Hàm kiểm tra nội dung comment bằng AI (Gemini)
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
      console.log(`Attempt ${attempt} to call Gemini moderation API...`);

      if (!process.env.GOOGLE_API_KEY) {
        console.log('No Google API key configured. Skipping external moderation.');
        break; // fallback luôn
      }

      const apiKey = process.env.GOOGLE_API_KEY;

      // ✅ Payload chuẩn cho Gemini moderation API
      const payload = {
        input: [{ text: content }]
      };

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:moderateText?key=${apiKey}`,
        payload,
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 15000
        }
      );

      // ✅ Chuẩn hoá kết quả response
      const moderation = response.data.moderationResponse || {};
      const categories = moderation.categories || {};
      const scores = moderation.scores || {};
      const flagged = moderation.blocked || false;

      // Tìm loại vi phạm (nếu có)
      let violationType = null;
      for (const [key, value] of Object.entries(categories)) {
        if (value === true) {
          violationType = key;
          break;
        }
      }

      const moderationResult = {
        isViolation: flagged || !!violationType,
        violationType: violationType,
        flagged: flagged,
        categories,
        scores,
        source: 'google'
      };

      moderationCache.set(cacheKey, { result: moderationResult, timestamp: Date.now() });
      apiStats.successfulCalls++;
      console.log('Gemini moderation call successful');
      return moderationResult;

    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error.response?.status, error.response?.data || error.message);

      // Nếu bị rate limit
      if (error.response?.status === 429) {
        apiStats.rateLimitHits++;
        const retryAfter = parseInt(error.response.headers['retry-after']) || baseDelay * attempt;
        console.log(`Rate limit hit (429). Retrying after ${retryAfter}ms...`);
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryAfter));
          continue;
        } else {
          console.log('Max retries reached. Using fallback moderation.');
          break;
        }
      }

      if (attempt === maxRetries) {
        console.error('All attempts failed. Using fallback moderation.');
        break;
      }

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
    // 🔞 Chửi tục tiếng Việt
    'địt', 'đụ', 'lồn', 'cặc', 'đéo', 'đcm', 'vãi l*n', 'vãi lồn', 'vcl', 'loz', 'clgt',
    'má mày', 'mẹ mày', 'đồ ngu', 'óc chó', 'não chó', 'ngu vãi', 'ngu như bò', 'ngu như lợn',
    // 🔞 Không dấu
    'dit', 'du', 'lon', 'cac', 'deo', 'dcm', 'vl', 'loz', 'oc cho', 'dm', 'cl',
    // 🔞 Tiếng Anh
    'fuck', 'shit', 'bitch', 'asshole', 'dick', 'pussy', 'bastard', 'slut', 'faggot', 'moron',
    // 🚫 Spam, lừa đảo
    'spam', 'scam', 'lừa đảo', 'lừa gạt', 'hàng fake', 'hàng giả',
    // 👎 Chê bai sản phẩm
    'rác', 'rác rưởi', 'đồ bỏ đi', 'tệ', 'quá tệ', 'cực kỳ tệ', 
    'kém chất lượng', 'không đáng tiền', 'phí tiền', 'dở ẹc', 'chán', 
    'vớ vẩn', 'xấu vãi', 'xấu như chó', 'thất vọng', 'cực kỳ thất vọng'
  ];
  
  const lowerContent = content.toLowerCase();
  let hasViolation = false;
  let violationType = null;
  
  for (const word of bannedWords) {
    if (lowerContent.includes(word)) {
      hasViolation = true;
      violationType = 'inappropriate_language';
      break;
    }
  }
  
  if (lowerContent.length > 500 || lowerContent.split(' ').length > 100) {
    hasViolation = true;
    violationType = 'spam';
  }
  
  if (/(.)\1{5,}/.test(content)) {
    hasViolation = true;
    violationType = 'spam';
  }
  
  const urlPattern = /(https?:\/\/[^\s]+)/g;
  const urls = content.match(urlPattern);
  if (urls && urls.length > 3) {
    hasViolation = true;
    violationType = 'spam';
  }
  
  return {
    isViolation: hasViolation,
    violationType,
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
