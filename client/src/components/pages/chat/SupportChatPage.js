import React, { useEffect, useRef, useState } from "react";
import { Container, Row, Col, Card, Button, Form, Badge } from "react-bootstrap";
import io from "socket.io-client";
import api from "../../../configs/Apis";

const socket = io("http://localhost:3000", {
  withCredentials: true,
  transports: ["websocket", "polling"],
});

const SupportChatPage = () => {
  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [me, setMe] = useState(null);
  const [text, setText] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    const init = async () => {
      // Lấy user hiện tại qua API dựa trên cookie tokenUser
      try {
        const meRes = await api.get('/user/info');
        if (meRes.data?.success) {
          const u = meRes.data.data.user;
          setMe(u);
          socket.emit('SET_USER_INFO', { userId: u.id || u._id, fullName: u.fullName });
        }
      } catch {}
      // Ensure a support room exists for current user
      const res = await api.get("/rooms-chat");
      if (res.data?.success) {
        const supportRoom = res.data.data.supportRoom;
        setRoom(supportRoom);

        // Join socket room
        socket.emit("JOIN_ROOM", supportRoom._id);

        // Optional: set user info if you have it in cookie/session
        // socket.emit("SET_USER_INFO", { userId: ..., fullName: ... });

        // Load existing chat history via API
        const chatRes = await api.get(`/chat/${supportRoom._id}`);
        if (chatRes.data?.success) {
          setMessages(
            chatRes.data.data.chats.map((c) => ({
              userId: c.user_id,
              fullName: c.infoUser?.fullName || "Người dùng",
              content: c.content,
              images: c.images || [],
              _id: c._id,
            }))
          );
        }
      }
    };
    init();

    socket.on("SERVER_RETURN_MESSAGE", (msg) => {
      setMessages((prev) => [...prev, { ...msg, _id: Math.random().toString(36).slice(2) }]);
    });

    return () => {
      socket.off("SERVER_RETURN_MESSAGE");
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    const content = text.trim();
    if (!content || !room?._id) return;
    socket.emit("CLIENT_SEND_MESSAGE", { content, images: [] });
    setText("");
  };

  return (
    <Container className="py-4">
      <Row>
        <Col md={8} className="mx-auto">
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <div>
                <strong>Hỗ trợ khách hàng</strong>
                {room && <Badge bg="secondary" className="ms-2">#{room._id.slice(-6)}</Badge>}
              </div>
              <div className="text-muted small">Kết nối tư vấn viên</div>
            </Card.Header>
            <Card.Body style={{ height: 480, overflow: "auto" }}>
              <div className="d-flex flex-column gap-2">
                {messages.map((m) => {
                  const myId = me?.id || me?._id;
                  const isMe = myId && (String(m.userId) === String(myId));
                  return (
                    <div key={m._id} className={`d-flex ${isMe ? 'justify-content-end' : 'justify-content-start'}`}>
                      <div className={`p-2 rounded ${isMe ? 'bg-primary text-white' : 'bg-light'}`} style={{ maxWidth: '70%' }}>
                        <div className="small fw-bold mb-1">{m.fullName}</div>
                        {m.content && <div>{m.content}</div>}
                        {m.images && m.images.length > 0 && (
                          <div className="mt-2 d-flex gap-2 flex-wrap">
                            {m.images.map((img, idx) => (
                              <img key={idx} src={img} alt="img" height={80} />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div ref={bottomRef} />
            </Card.Body>
            <Card.Footer>
              <Form onSubmit={(e) => { e.preventDefault(); sendMessage(); }}>
                <div className="d-flex">
                  <Form.Control
                    placeholder="Nhập tin nhắn..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                  />
                  <Button className="ms-2" onClick={sendMessage}>Gửi</Button>
                </div>
              </Form>
            </Card.Footer>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default SupportChatPage;


