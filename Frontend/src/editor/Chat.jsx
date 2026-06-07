import React, { useEffect, useRef, useState, useContext } from "react";
import axios from "../axios.js";
import { useParams, useNavigate } from "react-router-dom";
import { socket } from "../socket";
import { AuthContext } from "../context/Auth.jsx";

const Chat = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const bottomRef = useRef(null);

  const { user } = useContext(AuthContext);

  const [modalAlert, setModalAlert] = useState({
    isOpen: false,
    title: "",
    message: "",
    redirectPath: "",
  });

  const [currentUserId, setCurrentUserId] = useState(() => user?._id || null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [openMenuId, setOpenMenuId] = useState(null);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingContent, setEditingContent] = useState("");

  useEffect(() => {
    if (user?._id) {
      setCurrentUserId(user._id);
    }
  }, [user]);

  const fetchMessages = async () => {
    try {
      const res = await axios.get(
        `https://real-time-code-editor-vercodex.onrender.com/vercodex/get/message/${roomId}`,
        { withCredentials: true },
      );
      setMessages(res.data.data.chat || []);
      if (res.data.data.user) {
        setCurrentUserId(res.data.data.user);
      }
    } catch (err) {
      console.error(err);
      setError("Unable to load messages.");
    }
  };

  useEffect(() => {
    if (roomId) {
      fetchMessages();
    }
  }, [roomId]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 80);
    return () => clearTimeout(timeout);
  }, [messages]);

  const sendMessage = async () => {
    if (!message.trim()) return;

    try {
      setError("");
      setSending(true);

      await axios.post(
        "https://real-time-code-editor-vercodex.onrender.com/vercodex/send/message",
        {
          roomId,
          content: message.trim(),
        },
        { withCredentials: true },
      );

      setMessage("");
    } catch (err) {
      console.error(err);
      setError("Unable to send message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const saveEditedMessage = async (messageId) => {
    if (!editingContent.trim()) return;
    try {
      setError("");
      await axios.patch(
        `https://real-time-code-editor-vercodex.onrender.com/vercodex/edit/message/${messageId}`,
        { content: editingContent.trim() },
        { withCredentials: true },
      );
      setEditingMessageId(null);
      setEditingContent("");
    } catch (err) {
      console.error(err);
      setError("Failed to edit message. Time limit might be exceeded.");
    }
  };

  const deleteForEveryone = async (chatId) => {
    try {
      setError("");
      await axios.delete(
        `https://real-time-code-editor-vercodex.onrender.com/vercodex/delete/everyone/${roomId}?chatId=${chatId}`,
        { withCredentials: true },
      );
    } catch (err) {
      console.error(err);
      setError("Delete for everyone failed.");
    }
  };

  const deleteForMe = async (chatId) => {
    try {
      setError("");
      await axios.patch(
        "https://real-time-code-editor-vercodex.onrender.com/vercodex/delete/me",
        { roomId, messageIds: [chatId] },
        { withCredentials: true },
      );
      setMessages((prev) =>
        prev.filter((m) => String(m._id) !== String(chatId)),
      );
    } catch (err) {
      console.error(err);
      setError("Delete for me failed.");
    }
  };

  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!roomId) return;
    socket.emit("join-room", roomId);
    return () => {
      socket.emit("leave-room", roomId);
    };
  }, [roomId]);

  useEffect(() => {
    if (!roomId) return;

    const onNewMessage = (msg) => setMessages((prev) => [...prev, msg]);

    const handleRoomDeleted = () => {
      setModalAlert({
        isOpen: true,
        title: "Workspace Deleted",
        message: "This workspace has been deleted by the owner.",
        redirectPath: "/dashboard/my-rooms",
      });
    };

    const handleMemberRemoved = (data) => {
      if (currentUserId && String(data.userId) === String(currentUserId)) {
        setModalAlert({
          isOpen: true,
          title: "Access Revoked",
          message: "You have been removed from this room by the owner.",
          redirectPath: "/dashboard/my-rooms",
        });
      }
    };

    const onEdit = (data) =>
      setMessages((prev) =>
        prev.map((m) =>
          String(m._id) === String(data._id)
            ? {
                ...m,
                content: data.content,
                isEdited: true,
                editedAt: data.editedAt,
              }
            : m,
        ),
      );

    const onDeleteEveryone = (data) => {
      setMessages((prev) =>
        prev.filter((m) => String(m._id) !== String(data._id)),
      );
    };

    socket.on("new-message", onNewMessage);
    socket.on("room-deleted", handleRoomDeleted);
    socket.on("member-removed", handleMemberRemoved);
    socket.on("edit-message", onEdit);
    socket.on("delete-everyone", onDeleteEveryone);

    return () => {
      socket.off("new-message", onNewMessage);
      socket.off("edit-message", onEdit);
      socket.off("delete-everyone", onDeleteEveryone);
      socket.off("room-deleted", handleRoomDeleted);
      socket.off("member-removed", handleMemberRemoved);
    };
  }, [roomId, currentUserId, navigate]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.15),transparent_25%),radial-gradient(circle_at_bottom_right,rgba(15,23,42,0.95),transparent_40%),#020617] text-white">
      <div className="mx-auto w-full max-w-350 px-4 py-4 sm:px-5 lg:px-6">
        <div className="rounded-4xl border border-slate-800/90 bg-slate-950/95 shadow-[0_40px_120px_-80px_rgba(56,189,248,0.6)]">
          <div className="flex flex-col gap-5 p-5 lg:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-slate-50">
                  Room Chat
                </h1>
                <p className="mt-1 text-sm text-slate-400">
                  Modern chat with message support.
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-hidden rounded-[28px] border border-slate-800/90 bg-slate-900/75 shadow-inner">
              <div className="flex min-h-[calc(100vh-220px)] flex-col overflow-hidden rounded-[28px] bg-slate-950/95">
                <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-8 sm:py-8 space-y-6">
                  {messages.length === 0 ? (
                    <div className="flex min-h-60 items-center justify-center rounded-3xl border border-dashed border-slate-700 bg-slate-950/80 p-10 text-center text-slate-500">
                      <div>
                        <p className="text-xl font-semibold text-slate-100">
                          No messages yet
                        </p>
                        <p className="mt-2 text-sm text-slate-400">
                          Send a message to get started.
                        </p>
                      </div>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const msgSenderId = msg.senderId?._id || msg.senderId;
                      const isMine =
                        String(msgSenderId) === String(currentUserId);

                      const isEditing = editingMessageId === msg._id;
                      const bubbleClass = isMine
                        ? "bg-sky-600 text-slate-950 border-sky-400"
                        : "bg-slate-900 text-slate-100 border-slate-800";
                      const timeTextClass = isMine
                        ? "text-slate-950/80"
                        : "text-slate-400";

                      const displayUsername =
                        msg.senderId?.username || msg.username || "Guest";

                      return (
                        <div
                          key={msg._id}
                          className={`flex w-full ${isMine ? "justify-end" : "justify-start"}`}
                        >
                          <div className="max-w-[86%] min-w-37.5 sm:max-w-[70%] md:max-w-[62%] lg:max-w-[55%] relative">
                            <div className="mb-2 flex items-center gap-3 text-[11px] uppercase tracking-[0.2em] text-slate-500">
                              {!isMine && (
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-sky-300">
                                  {displayUsername.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <span className="font-semibold text-slate-300">
                                {isMine ? "You" : displayUsername}
                              </span>
                              {msg.isEdited && (
                                <span className="text-slate-400 font-medium normal-case">
                                  (edited)
                                </span>
                              )}
                            </div>

                            <div
                              className={`relative rounded-3xl border px-4 py-4 shadow-[0_12px_40px_-24px_rgba(15,23,42,0.9)] ${bubbleClass}`}
                            >
                              {!isEditing && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenMenuId((current) =>
                                      current === msg._id ? null : msg._id,
                                    );
                                  }}
                                  className={`absolute top-3 right-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-700/80 shadow-sm transition duration-200 ease-out ${
                                    isMine
                                      ? "bg-slate-100 text-slate-950 hover:bg-slate-200"
                                      : "bg-slate-800 text-slate-200 hover:bg-slate-700"
                                  }`}
                                  aria-label="Open message actions"
                                >
                                  <svg
                                    viewBox="0 0 24 24"
                                    className="h-4 w-4"
                                    fill="currentColor"
                                  >
                                    <circle cx="12" cy="5" r="1.5" />
                                    <circle cx="12" cy="12" r="1.5" />
                                    <circle cx="12" cy="19" r="1.5" />
                                  </svg>
                                </button>
                              )}

                              {isEditing ? (
                                <div className="flex flex-col gap-2 pr-2">
                                  <textarea
                                    value={editingContent}
                                    onChange={(e) =>
                                      setEditingContent(e.target.value)
                                    }
                                    className="w-full min-h-16 p-2 text-sm rounded-xl border border-slate-700 bg-slate-950 text-slate-100 resize-none outline-none focus:border-sky-400"
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        saveEditedMessage(msg._id);
                                      }
                                    }}
                                  />
                                  <div className="flex justify-end gap-2 text-xs">
                                    <button
                                      type="button"
                                      onClick={() => setEditingMessageId(null)}
                                      className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => saveEditedMessage(msg._id)}
                                      className="px-3 py-1.5 rounded-xl bg-sky-500 text-slate-950 font-semibold hover:bg-sky-400 transition"
                                    >
                                      Save
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                msg.content && (
                                  <div
                                    className={`text-sm leading-7 whitespace-pre-wrap break-words pr-14 ${isMine ? "text-stone-100 font-medium" : "text-slate-100"}`}
                                  >
                                    {msg.content}
                                  </div>
                                )
                              )}

                              <div
                                className={`mt-4 flex items-center justify-between text-[11px] ${timeTextClass}`}
                              >
                                <span>
                                  {new Date(msg.createdAt).toLocaleTimeString(
                                    [],
                                    {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    },
                                  )}
                                </span>
                              </div>
                            </div>

                            {openMenuId === msg._id && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                onMouseDown={(e) => e.stopPropagation()}
                                className="absolute right-0 top-full z-40 mt-3 w-44 overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl"
                              >
                                {isMine && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingMessageId(msg._id);
                                      setEditingContent(msg.content);
                                      setOpenMenuId(null);
                                    }}
                                    className="w-full px-4 py-3 text-left text-sm text-slate-200 transition hover:bg-slate-800 border-b border-slate-900"
                                  >
                                    Edit message
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onMouseDown={(e) => e.stopPropagation()}
                                  onClick={() => {
                                    deleteForMe(msg._id);
                                    setOpenMenuId(null);
                                  }}
                                  className="w-full px-4 py-3 text-left text-sm text-slate-200 transition hover:bg-slate-800"
                                >
                                  Delete for me
                                </button>
                                {isMine && (
                                  <button
                                    type="button"
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onClick={() => {
                                      deleteForEveryone(msg._id);
                                      setOpenMenuId(null);
                                    }}
                                    className="w-full px-4 py-3 text-left text-sm text-rose-300 transition hover:bg-slate-800"
                                  >
                                    Delete for everyone
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={bottomRef} />
                </div>

                <div className="border-t border-slate-800/80 bg-slate-950/90 px-6 py-5 backdrop-blur-sm">
                  {error && (
                    <div className="mb-4 rounded-3xl border border-rose-500/25 bg-rose-500/5 px-4 py-3 text-sm text-rose-200">
                      {error}
                    </div>
                  )}

                  <div className="flex gap-4 items-end">
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      placeholder="Type your message..."
                      className="min-h-13.5 flex-1 resize-none rounded-[34px] border border-slate-800/80 bg-slate-950/95 px-5 py-4 text-sm text-slate-100 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20"
                    />

                    <button
                      type="button"
                      onClick={sendMessage}
                      disabled={sending}
                      className={`inline-flex h-14 items-center justify-center rounded-3xl px-6 text-sm font-semibold shadow-lg transition
                        ${
                          sending
                            ? "bg-slate-700 text-slate-300 cursor-not-allowed"
                            : "bg-linear-to-r from-sky-500 to-cyan-400 text-slate-950 hover:from-sky-400 hover:to-cyan-300"
                        }`}
                    >
                      {sending ? "Sending..." : "Send"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {modalAlert.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl transition-all">
            <h3 className="text-xl font-bold text-slate-50">
              {modalAlert.title}
            </h3>
            <p className="mt-3 text-sm text-slate-400 leading-relaxed">
              {modalAlert.message}
            </p>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setModalAlert((prev) => ({ ...prev, isOpen: false }));
                  if (modalAlert.redirectPath) {
                    navigate(modalAlert.redirectPath);
                  }
                }}
                className="rounded-2xl bg-sky-500 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-md transition hover:bg-sky-400"
              >
                Okay, Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
