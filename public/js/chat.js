// Đợi DOM load xong và socket sẵn sàng
document.addEventListener('DOMContentLoaded', function() {
    // Kiểm tra socket có sẵn không
    if (typeof socket === 'undefined') {
        console.error("❌ Socket not available");
        return;
    }

    // Debug: Kiểm tra socket connection
    console.log("🔌 Socket connection status:", socket.connected);
    console.log("🔌 Socket ID:", socket.id);

    // Lấy thông tin user từ DOM
    const myId = document.querySelector("[my-id]")?.getAttribute("my-id");
    const myName = document.querySelector("[my-name]")?.getAttribute("my-name") || "User";

    console.log("👤 User info from DOM:", { userId: myId, fullName: myName });

    // Gửi thông tin user khi kết nối socket
    if (myId && socket) {
        socket.emit("SET_USER_INFO", {
            userId: myId,
            fullName: myName
        });
        console.log("👤 User info sent:", { userId: myId, fullName: myName });
    }

    // Join room chat khi vào trang
    const chatContainer = document.querySelector(".chat");
    if (chatContainer) {
        // Lấy room ID từ URL
        const roomId = window.location.pathname.split('/').pop();
        if (roomId && roomId !== 'chat') {
            console.log('Joining room:', roomId);
            socket.emit('JOIN_ROOM', roomId);
        }
    }

    // FileUploadWithPreview - chỉ khởi tạo nếu có
    let upload = null;
    if (typeof FileUploadWithPreview !== 'undefined') {
        upload = new FileUploadWithPreview.FileUploadWithPreview("upload-image", {
            multiple: true,
            maxFileCount: 6
        });
        console.log("📁 FileUploadWithPreview initialized");
    } else {
        console.log("⚠️ FileUploadWithPreview not available");
    }

    //CLIENT_SEND_MESSAGE
    const formSendData = document.querySelector(".inner-form");
    if(formSendData){
        console.log("📝 Form found, adding event listener");
        // Kiểm tra xem form đã có event listener chưa
        if (!formSendData.hasAttribute('data-chat-initialized')) {
            formSendData.setAttribute('data-chat-initialized', 'true');
            formSendData.addEventListener("submit", (e) => {
                e.preventDefault();
                const content = e.target.elements.content.value;
                const images = upload ? (upload.cachedFileArray || []) : [];
                //Gửi tin nhắn hoặc ảnh lên server
                if(content || images.length > 0){
                    console.log('Sending message:', content);
                    socket.emit("CLIENT_SEND_MESSAGE",{
                        content: content,
                        images: images
                    });
                    e.target.elements.content.value = "";
                    if (upload) {
                        upload.resetPreviewPanel(); // clear all selected images
                    }
                    
                
                    socket.emit("CLIENT_SEND_TYPING", "hidden");
                }
                
                
            })
        } else {
            console.log("📝 Form already has event listener");
        }
    } else {
        console.log("❌ Form not found");
    }
    //END CLIENT_SEND_MESSAGE

    //SERVER RETURN MESSAGE
    // Kiểm tra xem đã đăng ký event listener chưa
    if (!window.chatMessageListenerRegistered) {
        window.chatMessageListenerRegistered = true;
        socket.on("SERVER_RETURN_MESSAGE",(data)=>{
            console.log('Received message:', data);
            const currentMyId = document.querySelector("[my-id]").getAttribute("my-id");
            const body = document.querySelector(".chat .inner-body");
            let htmlFullName = "";
            let htmlContent = "";
            let htmlImages = "";
            const boxTyping = document.querySelector(".inner-list-typing");
            const div = document.createElement("div");

            if(currentMyId == data.userId){
                div.classList.add("inner-outgoing");
            }
            else{
                div.classList.add("inner-incoming");
                htmlFullName = `<div class="inner-name">${data.fullName}</div>`;
            }
            if(data.content){
                htmlContent = `
                <div class="inner-content">${data.content}</div>
              `;
            }
            if(data.images) {
                htmlImages += `<div class="inner-images">`;
            
                for (const image of data.images) {
                  htmlImages += `
                    <img src="${image}">
                  `;
                }
            
                htmlImages += `</div>`;
              }
            div.innerHTML = `
            ${htmlFullName}
            ${htmlContent}
            ${htmlImages}
            `;
            console.log(div);
            body.insertBefore(div, boxTyping);
            

            body.scrollTop = body.scrollHeight;
            // Preview Image
            const boxImages = div.querySelector(".inner-images");
            if(boxImages && typeof Viewer !== 'undefined') {
                const gallery = new Viewer(boxImages);
            }
        })
    } else {
        console.log("📨 Message listener already registered");
    }
    //END SERVER RETURN MESSAGE

    //Scroll to bottom of chat
    const bodyChat = document.querySelector(".chat .inner-body");
    if(bodyChat){
        bodyChat.scrollTop = bodyChat.scrollHeight;
    }
    //End Scroll to bottom of chat

    //show TYPING
    var timeOutTyping;
    const showTyping = ()=>{
        socket.emit("CLIENT_SEND_TYPING","show");

        clearTimeout(timeOutTyping);
        timeOutTyping = setTimeout(()=>{
            socket.emit("CLIENT_SEND_TYPING","hidden");
        },3000);

    }
    //end show TYPING




    //Icon chat
    const buttonIcon = document.querySelector('.button-icon')
    const tooltip = document.querySelector('.tooltip')
    if (buttonIcon && tooltip && typeof Popper !== 'undefined') {
        Popper.createPopper(buttonIcon, tooltip)
        buttonIcon.onclick = () => {
            tooltip.classList.toggle('shown')
        }
    }
      
    const emojiPicker = document.querySelector('emoji-picker');
    if(emojiPicker){
        const inputChat = document.querySelector(".chat .inner-foot input[name='content']");
        emojiPicker.addEventListener('emoji-click', (event)=>{
            const icon = event.detail.unicode;
            if(inputChat) {
                inputChat.value = inputChat.value + icon;
                const end = inputChat.value.length;
                inputChat.setSelectionRange(end, end);
                inputChat.focus();

                showTyping();
            }
        });
        inputChat.addEventListener("keyup", () => {
            console.log("CLIENT_SEND_TYPING");
            showTyping();
        });
        
    }
    //End Icon chat

    //SERVER RETURN TYPING
    const elementsListTyping = document.querySelector(".chat .inner-list-typing");
    if(elementsListTyping){
        socket.on("SERVER_RETURN_TYPING",(data)=>{
            if(data.type == "show"){
                const exitTyping = elementsListTyping.querySelector(`[user-id="${data.userId}"]`);
                if(!exitTyping){
                    const bodyChat = document.querySelector(".chat .inner-body");
                    const boxTyping = document.createElement("div");
                    boxTyping.classList.add("box-typing");
                    boxTyping.setAttribute("user-id",data.userId);

                    boxTyping.innerHTML = `
                        <div class="inner-name">${data.fullName}</div>
                        <div class="inner-dots">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    `;
                    elementsListTyping.appendChild(boxTyping);
                    bodyChat.scrollTop = bodyChat.scrollHeight;
                }
            }
            else{
                const boxTypingRemove = elementsListTyping.querySelector(`[user-id="${data.userId}"]`);
                if(boxTypingRemove){
                    elementsListTyping.removeChild(boxTypingRemove);
                }
            }
        })
    }

    //END SERVER RETURN TYPING

    // Preview Image
    const chatBody = document.querySelector(".chat .inner-body");

    if(chatBody && typeof Viewer !== 'undefined') {
      const gallery = new Viewer(chatBody);
    }
    // End Preview Image
});