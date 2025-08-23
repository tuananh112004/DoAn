# AIChatbot Helper - README

## Tổng quan
`aiChatbot.js` là module xử lý logic AI cho chatbot bán hàng, tích hợp mô hình RAG (Retrieval-Augmented Generation) với Google Gemini. Module này giúp chatbot trả lời tự nhiên, chính xác dựa trên dữ liệu sản phẩm thực tế trong database.

## Luồng xử lý chính
1. **User gửi câu hỏi**
   - Ví dụ: "Tôi bị tiểu đường thì nên dùng sản phẩm nào?"
2. **Lấy embedding cho câu hỏi**
   - Sử dụng Gemini Embedding API để chuyển câu hỏi thành vector embedding.
3. **So sánh với embedding sản phẩm trong database**
   - Tính cosine similarity giữa embedding câu hỏi và embedding từng sản phẩm.
   - Lấy top-k sản phẩm liên quan nhất.
4. **Tạo context sản phẩm**
   - Đóng gói thông tin ngắn gọn (tên, giá, tồn kho, mô tả, ID) của các sản phẩm top-k.
5. **Gửi context + câu hỏi sang Gemini**
   - Gemini sinh câu trả lời tự nhiên, dựa trên dữ liệu thực của cửa hàng.
6. **Trả về kết quả cho user**
   - Chatbot trả lời ngắn gọn, dẫn nguồn bằng ID sản phẩm nếu có.

## Các hàm chính
- `_callChatAPI`: Gọi Gemini để sinh câu trả lời dựa trên context và lịch sử chat.
- `_callEmbeddingAPI`: Gọi Gemini để lấy embedding cho câu hỏi hoặc sản phẩm.
- `findNearestByEmbedding`: So sánh embedding câu hỏi với embedding sản phẩm, lấy top-k sản phẩm liên quan.
- `generateRAGProductAnswer`: Tích hợp các bước embedding, truy vấn sản phẩm, tạo context và gọi Gemini.
- `generateResponse`: Hàm tổng hợp, nhận intent và context, luôn dùng RAG cho mọi câu hỏi.

## Intent & Entity
- Phân tích intent (ý định) và entity (thực thể) từ câu hỏi để xác định loại truy vấn: tìm kiếm, tư vấn, so sánh, dinh dưỡng...
- Tuy nhiên, với flow mới, mọi câu hỏi đều được xử lý qua RAG để đảm bảo Gemini trả lời dựa trên dữ liệu thực.

## Ưu điểm
- Đảm bảo mọi câu trả lời đều dựa trên sản phẩm thực tế trong database.
- Tiết kiệm token, chỉ gửi context sản phẩm liên quan lên Gemini.
- Dễ mở rộng filter (giá, danh mục, còn hàng...).

## Ví dụ luồng xử lý
```
User: "Tôi bị tiểu đường thì nên dùng sản phẩm nào?"
→ Lấy embedding câu hỏi
→ So sánh với embedding sản phẩm, lấy top-k sản phẩm ít đường/không đường
→ Tạo context sản phẩm
→ Gửi context + câu hỏi sang Gemini
→ Gemini trả lời: "Bạn nên chọn các sản phẩm sau: ... (ID sản phẩm)"
```

## Mở rộng
- Có thể tích hợp thêm filter nâng cao, truy vấn theo category, giá, tình trạng kho...
- Có thể thay Gemini bằng LLM khác nếu cần.

---
Nếu cần giải thích chi tiết từng hàm hoặc flow cụ thể, hãy yêu cầu thêm!
