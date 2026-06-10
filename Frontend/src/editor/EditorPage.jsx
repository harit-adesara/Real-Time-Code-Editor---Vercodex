// import React, {
//   useEffect,
//   useState,
//   useContext,
//   useRef,
//   useCallback,
// } from "react";
// import Editor from "@monaco-editor/react";
// import axios from "../axios.js";
// import { useNavigate, useParams } from "react-router-dom";
// import { socket } from "../socket";
// import { AuthContext } from "../context/Auth.jsx";

// import * as Y from "yjs";
// import { MonacoBinding } from "y-monaco";

// const CURSOR_COLORS = [
//   "#FF6B6B",
//   "#4ECDC4",
//   "#45B7D1",
//   "#96CEB4",
//   "#FFEAA7",
//   "#DDA0DD",
//   "#98D8C8",
//   "#F7DC6F",
//   "#BB8FCE",
//   "#85C1E9",
// ];

// const getUserColor = (userId) => {
//   if (!userId) return CURSOR_COLORS[0];
//   let hash = 0;
//   for (let i = 0; i < userId.length; i++) {
//     hash = userId.charCodeAt(i) + ((hash << 5) - hash);
//   }
//   return CURSOR_COLORS[Math.abs(hash) % CURSOR_COLORS.length];
// };

// const EditorPage = () => {
//   const navigate = useNavigate();
//   const { roomId } = useParams();

//   const [editorInstance, setEditorInstance] = useState(null);

//   const [vercoAILoading, setVercoAILoading] = useState(false);
//   const [showAIBox, setShowAIBox] = useState(false);
//   const [aiResult, setAiResult] = useState("");

//   const [showChatBox, setShowChatBox] = useState(false);
//   const [chatInput, setChatInput] = useState("");
//   const [chatMessages, setChatMessages] = useState([]);
//   const [chatLoading, setChatLoading] = useState(false);

//   const editorRef = useRef(null);
//   const ydocRef = useRef(null);
//   const bindingRef = useRef(null);
//   // Store Monaco decorations for remote cursors: { userId -> decorationId[] }
//   const cursorDecorationsRef = useRef({});
//   // Store widget elements for cursor labels
//   const cursorWidgetsRef = useRef({});

//   const { user } = useContext(AuthContext);
//   const currentUserId = user?._id;

//   const [commitLoading, setCommitLoading] = useState(false);
//   const [restoreLoading, setRestoreLoading] = useState(false);

//   const [commitMsg, setCommitMsg] = useState("");
//   const [restoreCommitNo, setRestoreCommitNo] = useState("");
//   const [showCommitBox, setShowCommitBox] = useState(false);
//   const [showRestoreBox, setShowRestoreBox] = useState(false);

//   const [nodes, setNodes] = useState([]);
//   const [selectedFile, setSelectedFile] = useState(null);
//   const [input, setInput] = useState("");

//   const [logs, setLogs] = useState([
//     { message: "SYSTEM: Welcome to Vercodex Terminal" },
//   ]);

//   const [history, setHistory] = useState([]);

//   const [creatingFileIn, setCreatingFileIn] = useState(null);
//   const [creatingFolderIn, setCreatingFolderIn] = useState(null);
//   const [newName, setNewName] = useState("");
//   const [renamingNode, setRenamingNode] = useState(null);

//   const [sidebarWidth, setSidebarWidth] = useState(320);
//   const [terminalHeight, setTerminalHeight] = useState(220);

//   const [modalAlert, setModalAlert] = useState({
//     isOpen: false,
//     title: "",
//     message: "",
//     redirectPath: "",
//   });

//   useEffect(() => {
//     getTree();
//   }, []);

//   // ================= YJS + SOCKET SYNC =================
//   useEffect(() => {
//     if (!selectedFile || !editorInstance) return;

//     const ydoc = new Y.Doc();
//     const ytext = ydoc.getText(selectedFile._id);
//     ydocRef.current = ydoc;

//     // Register BEFORE join — never miss an update
//     const handleRemoteUpdate = (payload) => {
//       if (
//         payload.docId === selectedFile._id &&
//         payload.update &&
//         ydocRef.current
//       ) {
//         try {
//           Y.applyUpdate(
//             ydocRef.current,
//             new Uint8Array(payload.update),
//             "remote-sync",
//           );
//         } catch (error) {
//           console.error("Failed to apply Yjs update:", error);
//         }
//       }
//     };
//     socket.on("doc-update", handleRemoteUpdate);

//     // Send local changes outward
//     const updateHandler = (update, origin) => {
//       if (origin === "remote-sync") return;
//       socket.emit("doc-update", {
//         docId: selectedFile._id,
//         update: Array.from(update),
//       });
//     };
//     ydoc.on("update", updateHandler);

//     socket.emit("join-document", selectedFile._id, (documentState) => {
//       if (documentState) {
//         Y.applyUpdate(ydoc, new Uint8Array(documentState), "remote-sync");
//       } else if (ytext.length === 0 && selectedFile.content) {
//         ytext.insert(0, selectedFile.content);
//       }

//       const model = editorInstance.getModel();
//       if (!model) return;

//       const binding = new MonacoBinding(
//         ytext,
//         model,
//         new Set([editorInstance]),
//         null,
//       );
//       bindingRef.current = binding;
//     });

//     return () => {
//       socket.emit("leave-document", selectedFile._id);
//       ydoc.off("update", updateHandler);
//       socket.off("doc-update", handleRemoteUpdate);

//       // Clear all cursor decorations on file switch
//       clearAllCursorDecorations();

//       if (bindingRef.current) {
//         bindingRef.current.destroy();
//         bindingRef.current = null;
//       }

//       ydoc.destroy();
//       ydocRef.current = null;
//     };
//   }, [selectedFile, editorInstance]);

//   // ================= AUTOSAVE (debounced 3s after last local keystroke) =================
//   useEffect(() => {
//     if (!selectedFile) return;

//     // Keep a stable ref to the fileId so the timeout closure is safe
//     const fileId = selectedFile._id;
//     let debounceTimer = null;
//     let attached = false;

//     const handleTypingStop = (update, origin) => {
//       if (origin === "remote-sync") return;
//       clearTimeout(debounceTimer);
//       debounceTimer = setTimeout(() => {
//         const content = ydocRef.current?.getText(fileId)?.toString();
//         if (content !== undefined) {
//           saveContent(fileId, content);
//         }
//       }, 3000);
//     };

//     // Attach once ydoc is ready — use the ref directly, no risky polling
//     // The Yjs effect always runs before this one (same dep change),
//     // but ydocRef is set synchronously at top of that effect so it's ready here
//     if (ydocRef.current) {
//       ydocRef.current.on("update", handleTypingStop);
//       attached = true;
//     }

//     return () => {
//       clearTimeout(debounceTimer);
//       // Only call .off if we successfully attached AND ydoc still exists
//       if (attached && ydocRef.current) {
//         ydocRef.current.off("update", handleTypingStop);
//       }
//     };
//   }, [selectedFile, editorInstance]); // editorInstance dep ensures ydoc is ready

//   // ================= CURSOR: SEND LOCAL CURSOR POSITION =================

//   // ================= CURSOR: SEND LOCAL CURSOR POSITION =================
//   useEffect(() => {
//     if (!editorInstance || !selectedFile || !roomId) return;

//     const disposable = editorInstance.onDidChangeCursorPosition((e) => {
//       socket.emit("cursor-move", {
//         roomId,
//         fileId: selectedFile._id,

//         position: {
//           lineNumber: e.position.lineNumber,
//           column: e.position.column,
//         },

//         selection: editorInstance.getSelection(),
//       });
//     });

//     return () => disposable.dispose();
//   }, [editorInstance, selectedFile, roomId]);
//   // useEffect(() => {
//   //   if (!editorInstance || !selectedFile || !roomId) return;

//   //   const disposable = editorInstance.onDidChangeCursorPosition((e) => {
//   //     socket.emit("cursor-move", {
//   //       roomId,
//   //       position: {
//   //         lineNumber: e.position.lineNumber,
//   //         column: e.position.column,
//   //       },
//   //       selection: editorInstance.getSelection(),
//   //     });
//   //   });

//   //   return () => disposable.dispose();
//   // }, [editorInstance, selectedFile, roomId]);

//   // ================= CURSOR: RECEIVE REMOTE CURSORS =================
//   // useEffect(() => {
//   //   if (!editorInstance) return;

//   //   const handleCursorUpdate = (data) => {
//   //     // Don't render your own cursor
//   //     if (String(data.userId) === String(currentUserId)) return;

//   //     renderRemoteCursor(data);
//   //   };

//   //   socket.on("cursor-update", handleCursorUpdate);

//   //   return () => {
//   //     socket.off("cursor-update", handleCursorUpdate);
//   //     clearAllCursorDecorations();
//   //   };
//   // }, [editorInstance, currentUserId]);

//   // ================= CURSOR: RECEIVE REMOTE CURSORS =================
//   // useEffect(() => {
//   //   if (!editorInstance || !selectedFile) return;

//   //   const handleCursorUpdate = (data) => {
//   //     // Ignore own cursor
//   //     if (String(data.userId) === String(currentUserId)) return;

//   //     // Ignore other file cursors
//   //     if (String(data.fileId) !== String(selectedFile._id)) return;

//   //     renderRemoteCursor(data);
//   //   };

//   //   socket.on("cursor-update", handleCursorUpdate);

//   //   return () => {
//   //     socket.off("cursor-update", handleCursorUpdate);
//   //     clearAllCursorDecorations();
//   //   };
//   // }, [editorInstance, currentUserId, selectedFile]);

//   // ================= CURSOR RENDERING HELPERS =================
//   const clearAllCursorDecorations = useCallback(() => {
//     if (!editorInstance) return;

//     // Remove all decorations
//     Object.keys(cursorDecorationsRef.current).forEach((userId) => {
//       try {
//         editorInstance.deltaDecorations(
//           cursorDecorationsRef.current[userId] || [],
//           [],
//         );
//       } catch (_) {}
//     });
//     cursorDecorationsRef.current = {};

//     // Remove all label widgets
//     Object.values(cursorWidgetsRef.current).forEach((widget) => {
//       try {
//         editorInstance.removeContentWidget(widget);
//       } catch (_) {}
//     });
//     cursorWidgetsRef.current = {};
//   }, [editorInstance]);

//   const renderRemoteCursor = useCallback(
//     (data) => {
//       if (!editorInstance || !data.position) return;

//       const { userId, username, position, selection } = data;
//       const color = getUserColor(userId);
//       const userIdStr = String(userId);

//       // ---- 1. Cursor line decoration ----
//       const decorations = [];

//       // Thin vertical cursor bar
//       decorations.push({
//         range: {
//           startLineNumber: position.lineNumber,
//           startColumn: position.column,
//           endLineNumber: position.lineNumber,
//           endColumn: position.column,
//         },
//         options: {
//           className: `remote-cursor-${userIdStr}`,
//           beforeContentClassName: `remote-cursor-before-${userIdStr}`,
//         },
//       });

//       // Selection highlight if user has selected text
//       if (
//         selection &&
//         (selection.startLineNumber !== selection.endLineNumber ||
//           selection.startColumn !== selection.endColumn)
//       ) {
//         decorations.push({
//           range: {
//             startLineNumber: selection.startLineNumber,
//             startColumn: selection.startColumn,
//             endLineNumber: selection.endLineNumber,
//             endColumn: selection.endColumn,
//           },
//           options: {
//             className: `remote-selection-${userIdStr}`,
//             inlineClassName: `remote-selection-inline-${userIdStr}`,
//           },
//         });
//       }

//       // Inject CSS for this user's color dynamically
//       injectCursorStyle(userIdStr, color);

//       // Apply decorations
//       const prevDecorations = cursorDecorationsRef.current[userIdStr] || [];
//       cursorDecorationsRef.current[userIdStr] = editorInstance.deltaDecorations(
//         prevDecorations,
//         decorations,
//       );

//       // ---- 2. Username label widget ----
//       // Remove existing widget first
//       if (cursorWidgetsRef.current[userIdStr]) {
//         try {
//           editorInstance.removeContentWidget(
//             cursorWidgetsRef.current[userIdStr],
//           );
//         } catch (_) {}
//       }

//       const widget = {
//         getId: () => `cursor-label-${userIdStr}`,
//         getDomNode: () => {
//           const node = document.createElement("div");
//           node.textContent = username || "User";
//           node.style.cssText = `
//             background: ${color};
//             color: #000;
//             font-size: 11px;
//             font-weight: 600;
//             padding: 1px 5px;
//             border-radius: 3px;
//             pointer-events: none;
//             white-space: nowrap;
//             z-index: 100;
//             font-family: sans-serif;
//           `;
//           return node;
//         },
//         getPosition: () => ({
//           position: {
//             lineNumber: position.lineNumber,
//             column: position.column,
//           },
//           preference: [
//             window.monaco?.editor?.ContentWidgetPositionPreference?.ABOVE,
//             window.monaco?.editor?.ContentWidgetPositionPreference?.BELOW,
//           ],
//         }),
//       };

//       editorInstance.addContentWidget(widget);
//       cursorWidgetsRef.current[userIdStr] = widget;
//     },
//     [editorInstance],
//   );

//   //

//   useEffect(() => {
//     if (!editorInstance || !selectedFile) return;

//     const removeRemoteCursor = (userId) => {
//       const userIdStr = String(userId);

//       // Remove Monaco decorations
//       if (cursorDecorationsRef.current[userIdStr]) {
//         try {
//           editorInstance.deltaDecorations(
//             cursorDecorationsRef.current[userIdStr],
//             [],
//           );
//         } catch (_) {}

//         delete cursorDecorationsRef.current[userIdStr];
//       }

//       // Remove username widget
//       if (cursorWidgetsRef.current[userIdStr]) {
//         try {
//           editorInstance.removeContentWidget(
//             cursorWidgetsRef.current[userIdStr],
//           );
//         } catch (_) {}

//         delete cursorWidgetsRef.current[userIdStr];
//       }
//     };

//     const handleCursorUpdate = (data) => {
//       // Ignore own cursor
//       if (String(data.userId) === String(currentUserId)) return;

//       // If user switched file, remove old cursor instantly
//       if (String(data.fileId) !== String(selectedFile._id)) {
//         removeRemoteCursor(data.userId);
//         return;
//       }

//       // Same file -> render cursor
//       renderRemoteCursor(data);
//     };

//     socket.on("cursor-update", handleCursorUpdate);

//     return () => {
//       socket.off("cursor-update", handleCursorUpdate);

//       clearAllCursorDecorations();
//     };
//   }, [
//     editorInstance,
//     selectedFile,
//     currentUserId,
//     renderRemoteCursor,
//     clearAllCursorDecorations,
//   ]);

//   useEffect(() => {
//     clearAllCursorDecorations();
//   }, [selectedFile]);

//   //

//   // Inject per-user cursor CSS once
//   const injectedStylesRef = useRef(new Set());
//   const injectCursorStyle = (userIdStr, color) => {
//     if (injectedStylesRef.current.has(userIdStr)) return;
//     injectedStylesRef.current.add(userIdStr);

//     const style = document.createElement("style");
//     style.textContent = `
//       .remote-cursor-before-${userIdStr}::before {
//         content: '';
//         display: inline-block;
//         width: 2px;
//         height: 1.2em;
//         background: ${color};
//         position: absolute;
//         margin-left: -1px;
//         pointer-events: none;
//       }
//       .remote-selection-${userIdStr} {
//         background: ${color}33;
//       }
//     `;
//     document.head.appendChild(style);
//   };

//   // ================= ROOM SOCKET EVENTS =================
//   useEffect(() => {
//     if (!socket) return;

//     if (roomId) {
//       socket.emit("join-room", roomId);
//     }

//     const handleRoomDeleted = () => {
//       setModalAlert({
//         isOpen: true,
//         title: "Workspace Deleted",
//         message: "This workspace has been deleted by the owner.",
//         redirectPath: "/dashboard/my-rooms",
//       });
//     };
//     socket.on("room-deleted", handleRoomDeleted);

//     const handleMemberRemoved = (data) => {
//       if (currentUserId && String(data.userId) === String(currentUserId)) {
//         setModalAlert({
//           isOpen: true,
//           title: "Access Revoked",
//           message: "You have been removed from this room by the owner.",
//           redirectPath: "/dashboard/my-rooms",
//         });
//       }
//     };
//     socket.on("member-removed", handleMemberRemoved);

//     socket.on("new-file", (file) => {
//       setNodes((prev) => {
//         if (prev.some((n) => n._id === file._id)) return prev;
//         return [
//           ...prev,
//           {
//             _id: file._id,
//             name: file.name,
//             type: "file",
//             parentId: file.parentId,
//             roomId: file.roomId,
//           },
//         ];
//       });
//     });

//     socket.on("new-folder", (folder) => {
//       setNodes((prev) => {
//         if (prev.some((n) => n._id === folder._id)) return prev;
//         return [
//           ...prev,
//           {
//             _id: folder._id,
//             name: folder.name,
//             type: "folder",
//             parentId: folder.parentId,
//             roomId: folder.roomId,
//           },
//         ];
//       });
//     });

//     socket.on("rename-node", (data) => {
//       setNodes((prev) =>
//         prev.map((node) =>
//           node._id === data._id ? { ...node, name: data.newName } : node,
//         ),
//       );

//       setSelectedFile((prev) =>
//         prev && prev._id === data._id ? { ...prev, name: data.newName } : prev,
//       );
//     });

//     socket.on("delete-node", (data) => {
//       setNodes((prev) => {
//         const targetIds = data.deletedNodeIds || [data.nodeId];

//         const getChildIds = (idsToMatch, allNodes) => {
//           let collected = [...idsToMatch];
//           allNodes.forEach((node) => {
//             if (node.parentId && idsToMatch.includes(String(node.parentId))) {
//               collected.push(...getChildIds([String(node._id)], allNodes));
//             }
//           });
//           return collected;
//         };

//         const allDeletedIds = getChildIds(targetIds.map(String), prev);

//         setSelectedFile((prevFile) => {
//           if (prevFile && allDeletedIds.includes(String(prevFile._id)))
//             return null;
//           return prevFile;
//         });

//         return prev.filter((n) => !allDeletedIds.includes(String(n._id)));
//       });
//     });

//     return () => {
//       socket.off("new-file");
//       socket.off("new-folder");
//       socket.off("rename-node");
//       socket.off("delete-node");
//       socket.off("room-deleted", handleRoomDeleted);
//       socket.off("member-removed", handleMemberRemoved);
//       socket.emit("leave-room", roomId);
//     };
//   }, [roomId, currentUserId]);

//   // ================= COMMIT =================
//   const commitCode = async () => {
//     try {
//       if (!selectedFile || !commitMsg) return;
//       setCommitLoading(true);

//       await axios.post(
//         "https://real-time-code-editor-vercodex.onrender.com/vercodex/commit",
//         {
//           nodeId: selectedFile._id,
//           msg: commitMsg,
//           content: ydocRef.current?.getText(selectedFile._id)?.toString() || "",
//         },
//         { withCredentials: true },
//       );

//       setCommitMsg("");
//       setShowCommitBox(false);
//       getCommitHistory(selectedFile._id);
//     } catch (error) {
//       console.log(error);
//     } finally {
//       setCommitLoading(false);
//     }
//   };

//   // ================= RESTORE =================
//   const restoreCode = async () => {
//     try {
//       if (!selectedFile || !restoreCommitNo) return;
//       setRestoreLoading(true);

//       const res = await axios.post(
//         "https://real-time-code-editor-vercodex.onrender.com/vercodex/restore-version",
//         {
//           nodeId: selectedFile._id,
//           commitNumber: restoreCommitNo,
//         },
//         { withCredentials: true },
//       );

//       const ytext = ydocRef.current?.getText(selectedFile._id);
//       // FIX: was doing delete+insert twice — do it once
//       if (ytext) {
//         ytext.delete(0, ytext.length);
//         ytext.insert(0, res.data.data.content || "");
//       }

//       setShowRestoreBox(false);
//       setRestoreCommitNo("");
//     } catch (error) {
//       console.log(error);
//     } finally {
//       setRestoreLoading(false);
//     }
//   };

//   // ================= LANGUAGE =================
//   const getLanguage = (fileName) => {
//     const extension = fileName?.split(".").pop()?.toLowerCase();
//     const map = {
//       cpp: "cpp",
//       cxx: "cpp",
//       cc: "cpp",
//       c: "c",
//       java: "java",
//       py: "python",
//       js: "javascript",
//       ts: "typescript",
//       cs: "csharp",
//       go: "go",
//     };
//     return map[extension] || "plaintext";
//   };

//   // ================= GET TREE =================
//   const getTree = async () => {
//     try {
//       const response = await axios.get(
//         `https://real-time-code-editor-vercodex.onrender.com/vercodex/get/room/structure/${roomId}`,
//         { withCredentials: true },
//       );
//       setNodes(response.data.data.nodes);
//     } catch (error) {
//       console.log(error);
//     }
//   };

//   const createFileApi = async (parentId, name) => {
//     try {
//       await axios.post(
//         "https://real-time-code-editor-vercodex.onrender.com/vercodex/create/file",
//         { roomId, parentId, name },
//         { withCredentials: true },
//       );
//     } catch (error) {
//       console.log(error);
//     }
//   };

//   const createFolderApi = async (parentId, name) => {
//     try {
//       await axios.post(
//         "https://real-time-code-editor-vercodex.onrender.com/vercodex/create/folder",
//         { roomId, parentId, name },
//         { withCredentials: true },
//       );
//     } catch (error) {
//       console.log(error);
//     }
//   };

//   const renameNodeApi = async (nodeId, name) => {
//     try {
//       await axios.patch(
//         "https://real-time-code-editor-vercodex.onrender.com/vercodex/rename/node",
//         { nodeId, name },
//         { withCredentials: true },
//       );
//     } catch (error) {
//       console.log(error);
//     }
//   };

//   const deleteNode = async (nodeId) => {
//     try {
//       await axios.delete(
//         `https://real-time-code-editor-vercodex.onrender.com/vercodex/node/delete/${nodeId}`,
//         { withCredentials: true },
//       );
//     } catch (error) {
//       console.error("Delete failed:", error);
//     }
//   };

//   // ================= SAVE =================
//   const saveContent = async (fileId, content) => {
//     if (!fileId) return;
//     try {
//       await axios.post(
//         "https://real-time-code-editor-vercodex.onrender.com/vercodex/save/content",
//         { nodeId: fileId, content },
//         { withCredentials: true },
//       );
//       console.log("Auto saved");
//     } catch (err) {
//       console.log("Save failed", err);
//     }
//   };

//   // ================= SAVE ON FILE SWITCH =================
//   const handleFileSelect = async (node) => {
//     if (!node || node._id === selectedFile?._id) return;

//     if (selectedFile && ydocRef.current) {
//       const content =
//         ydocRef.current.getText(selectedFile._id)?.toString() || "";
//       await saveContent(selectedFile._id, content);
//     }

//     if (bindingRef.current) {
//       bindingRef.current.destroy();
//       bindingRef.current = null;
//     }
//     if (ydocRef.current) {
//       ydocRef.current.destroy();
//       ydocRef.current = null;
//     }

//     setSelectedFile(node);
//     getCommitHistory(node._id);
//   };

//   // ================= SAVE ON TAB CLOSE =================
//   useEffect(() => {
//     const handleBeforeUnload = () => {
//       if (!selectedFile || !ydocRef.current) return;
//       const content =
//         ydocRef.current.getText(selectedFile._id)?.toString() || "";
//       const blob = new Blob(
//         [JSON.stringify({ nodeId: selectedFile._id, content })],
//         { type: "application/json" },
//       );
//       navigator.sendBeacon(
//         "https://real-time-code-editor-vercodex.onrender.com/vercodex/save/content",
//         blob,
//       );
//     };

//     window.addEventListener("beforeunload", handleBeforeUnload);
//     return () => window.removeEventListener("beforeunload", handleBeforeUnload);
//   }, [selectedFile]);

//   // ================= COMMIT HISTORY =================
//   const getCommitHistory = async (nodeId) => {
//     try {
//       const response = await axios.get(
//         `https://real-time-code-editor-vercodex.onrender.com/vercodex/commit/history?nodeId=${nodeId}`,
//         { withCredentials: true },
//       );
//       setHistory(response.data.data.history);
//     } catch (error) {
//       console.log(error);
//     }
//   };

//   // ================= RUN =================
//   const runCode = async () => {
//     try {
//       if (!selectedFile) return;
//       const response = await axios.post(
//         "https://real-time-code-editor-vercodex.onrender.com/vercodex/run/code",
//         {
//           filename: selectedFile.name,
//           code: ydocRef.current?.getText(selectedFile._id)?.toString() || "",
//           stdin: input,
//         },
//         { withCredentials: true },
//       );

//       const result = response.data.data.result;
//       setLogs((prev) => [
//         ...prev,
//         { message: ">" },
//         { message: result.output || "No Output" },
//         ...(result.error ? [{ message: `ERROR: ${result.error}` }] : []),
//         { message: `TIME: ${result.time}ms | MEMORY: ${result.memory}KB` },
//       ]);
//     } catch (error) {
//       console.log(error);
//       setLogs((prev) => [...prev, { message: "ERROR: Execution failed" }]);
//     }
//   };

//   // ================= TREE =================
//   const renderTree = (parentId = null) => {
//     return nodes
//       .filter((node) => {
//         if (parentId === null) return !node.parentId;
//         return String(node.parentId) === String(parentId);
//       })
//       .map((node) => (
//         <div key={node._id}>
//           <div className="flex items-center justify-between hover:bg-[#2a2d2e] px-2 py-1 rounded text-sm">
//             <div
//               className="flex items-center gap-2 flex-1 cursor-pointer"
//               onClick={() => {
//                 if (node.type === "file") handleFileSelect(node);
//               }}
//             >
//               <span>{node.type === "folder" ? "📁" : "📄"}</span>

//               {renamingNode === node._id ? (
//                 <input
//                   autoFocus
//                   value={newName}
//                   onChange={(e) => setNewName(e.target.value)}
//                   onKeyDown={async (e) => {
//                     if (e.key === "Enter") {
//                       await renameNodeApi(node._id, newName);
//                       setRenamingNode(null);
//                       setNewName("");
//                     }
//                   }}
//                   className="bg-[#1e1e1e] text-white text-sm outline-none border border-blue-500 px-1 rounded"
//                 />
//               ) : (
//                 <span className="text-white">{node.name}</span>
//               )}
//             </div>

//             <div className="flex gap-1">
//               {node.type === "folder" && (
//                 <>
//                   <button
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       setCreatingFileIn(node._id);
//                       setCreatingFolderIn(null);
//                       setNewName("");
//                     }}
//                     className="bg-[#3c3c3c] text-white px-1 rounded text-xs"
//                   >
//                     +F
//                   </button>
//                   <button
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       setCreatingFolderIn(node._id);
//                       setCreatingFileIn(null);
//                       setNewName("");
//                     }}
//                     className="bg-[#3c3c3c] text-white px-1 rounded text-xs"
//                   >
//                     +D
//                   </button>
//                 </>
//               )}
//               <button
//                 onClick={(e) => {
//                   e.stopPropagation();
//                   setRenamingNode(node._id);
//                   setNewName(node.name);
//                 }}
//                 className="bg-blue-600 text-white px-1 rounded text-xs"
//               >
//                 R
//               </button>
//               <button
//                 onClick={(e) => {
//                   e.stopPropagation();
//                   deleteNode(node._id);
//                 }}
//                 className="bg-red-600 text-white px-1 rounded text-xs"
//               >
//                 X
//               </button>
//             </div>
//           </div>

//           {creatingFileIn === node._id && (
//             <div className="ml-6 mt-1">
//               <input
//                 autoFocus
//                 placeholder="file"
//                 value={newName}
//                 onChange={(e) => setNewName(e.target.value)}
//                 onKeyDown={async (e) => {
//                   if (e.key === "Enter") {
//                     await createFileApi(node._id, newName);
//                     setCreatingFileIn(null);
//                     setNewName("");
//                   }
//                 }}
//                 className="bg-[#1e1e1e] border border-blue-500 text-white px-2 py-1 rounded text-sm outline-none"
//               />
//             </div>
//           )}

//           {creatingFolderIn === node._id && (
//             <div className="ml-6 mt-1">
//               <input
//                 autoFocus
//                 placeholder="folder"
//                 value={newName}
//                 onChange={(e) => setNewName(e.target.value)}
//                 onKeyDown={async (e) => {
//                   if (e.key === "Enter") {
//                     await createFolderApi(node._id, newName);
//                     setCreatingFolderIn(null);
//                     setNewName("");
//                   }
//                 }}
//                 className="bg-[#1e1e1e] border border-blue-500 text-white px-2 py-1 rounded text-sm outline-none"
//               />
//             </div>
//           )}

//           {node.type === "folder" && (
//             <div className="ml-4 border-l border-gray-700 pl-2">
//               {renderTree(node._id)}
//             </div>
//           )}
//         </div>
//       ));
//   };

//   useEffect(() => {
//     const handleClick = (e) => {
//       if (e.target.tagName === "INPUT" || e.target.tagName === "BUTTON") return;
//       setCreatingFileIn(null);
//       setCreatingFolderIn(null);
//       setRenamingNode(null);
//       setNewName("");
//     };
//     document.addEventListener("mousedown", handleClick);
//     return () => document.removeEventListener("mousedown", handleClick);
//   }, []);

//   useEffect(() => {
//     const handleClickOutside = (e) => {
//       if (e.target.tagName === "INPUT" || e.target.tagName === "BUTTON") return;
//       setShowCommitBox(false);
//       setShowRestoreBox(false);
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   const checkWithVercoAI = async () => {
//     try {
//       if (!selectedFile) return;

//       setVercoAILoading(true);

//       const code = ydocRef.current?.getText(selectedFile._id)?.toString() || "";
//       const language = getLanguage(selectedFile.name);

//       const res = await axios.post(
//         "https://real-time-code-editor-vercodex.onrender.com/vercodex/code/optimize",
//         {
//           code,
//           language,
//         },
//         { withCredentials: true },
//       );

//       setAiResult(res.data?.data || "No response");
//       setShowAIBox(true);
//     } catch (err) {
//       console.log(err);
//       setAiResult(err.message || "AI check failed");
//       setShowAIBox(true);
//     } finally {
//       setVercoAILoading(false);
//     }
//   };

//   const sendMessageToAI = async () => {
//     if (!chatInput.trim()) return;

//     const userMessage = chatInput;
//     setChatInput("");

//     setChatMessages((prev) => [
//       ...prev,
//       { role: "user", text: userMessage },
//       { role: "ai", text: "" },
//     ]);

//     setChatLoading(true);

//     try {
//       const res = await fetch(
//         "https://real-time-code-editor-vercodex.onrender.com/vercodex/code/chatBot",
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           credentials: "include",
//           body: JSON.stringify({ message: userMessage }),
//         },
//       );

//       const reader = res.body.getReader();
//       const decoder = new TextDecoder("utf-8");

//       let aiText = "";

//       while (true) {
//         const { value, done } = await reader.read();
//         if (done) break;

//         const chunk = decoder.decode(value);
//         aiText += chunk;

//         setChatMessages((prev) => {
//           const updated = [...prev];
//           updated[updated.length - 1].text = aiText;
//           return updated;
//         });
//       }
//     } catch (err) {
//       console.log(err);
//       setChatMessages((prev) => {
//         const updated = [...prev];
//         updated[updated.length - 1].text = "Error generating response";
//         return updated;
//       });
//     } finally {
//       setChatLoading(false);
//     }
//   };

//   // ================= RENDER =================
//   return (
//     <div className="h-screen bg-[#1e1e1e] flex flex-col overflow-hidden">
//       {/* HEADER */}
//       <div className="h-12 border-b border-gray-700 flex items-center px-4 relative">
//         <div className="flex-1 flex items-center gap-3">
//           <button
//             onClick={runCode}
//             className="bg-green-600 hover:bg-green-700 text-white px-4 py-1 rounded"
//           >
//             Run
//           </button>
//           <button
//             onClick={() => navigate(`/chat/${roomId}`)}
//             className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded"
//           >
//             Chat
//           </button>
//         </div>

//         <button
//           onClick={() => setShowChatBox(true)}
//           className="bg-cyan-600 hover:bg-cyan-700 text-white px-3 py-1 rounded"
//         >
//           VercoAI
//         </button>

//         <div className="flex items-center gap-2 relative">
//           <button
//             onClick={checkWithVercoAI}
//             className="bg-cyan-600 hover:bg-cyan-700 text-white px-3 py-1 rounded"
//           >
//             {vercoAILoading ? "Checking..." : "Analysis"}
//           </button>

//           <button
//             onClick={() => {
//               setShowCommitBox((prev) => !prev);
//               setShowRestoreBox(false);
//             }}
//             className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded"
//           >
//             Commit
//           </button>

//           <button
//             onClick={() => {
//               setShowRestoreBox((prev) => !prev);
//               setShowCommitBox(false);
//             }}
//             className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded"
//           >
//             Restore
//           </button>

//           {showChatBox && (
//             <div className="absolute top-12 right-4 bg-[#1e1e1e] border border-gray-600 p-3 rounded w-96 z-50 flex flex-col h-[400px]">
//               {/* Header */}
//               <div className="text-white font-semibold mb-2 flex justify-between">
//                 <span>VercoAI Chat</span>
//                 <button onClick={() => setShowChatBox(false)}>✖</button>
//               </div>

//               {/* Messages */}
//               <div className="flex-1 overflow-y-auto text-sm space-y-2 text-gray-200">
//                 {chatMessages.map((msg, idx) => (
//                   <div
//                     key={idx}
//                     className={
//                       msg.role === "user" ? "text-blue-400" : "text-green-400"
//                     }
//                   >
//                     <pre className="whitespace-pre-wrap">{msg.text}</pre>
//                   </div>
//                 ))}
//               </div>

//               {/* Input */}
//               <div className="mt-2 flex gap-2">
//                 <input
//                   value={chatInput}
//                   onChange={(e) => setChatInput(e.target.value)}
//                   className="flex-1 p-2 bg-black text-white border border-gray-600 rounded"
//                   placeholder="Ask VercoAI..."
//                   onKeyDown={(e) => e.key === "Enter" && sendMessageToAI()}
//                 />

//                 <button
//                   onClick={sendMessageToAI}
//                   className="bg-cyan-600 px-3 py-1 rounded text-white"
//                 >
//                   Send
//                 </button>
//               </div>
//             </div>
//           )}

//           {showAIBox && (
//             <div className="absolute top-12 right-4 bg-[#1e1e1e] border border-gray-600 p-3 rounded w-96 z-50">
//               <div className="text-white font-semibold mb-2">Analysis</div>

//               {aiResult?.error ? (
//                 <div className="text-red-400">{aiResult.error}</div>
//               ) : (
//                 <div className="text-xs text-gray-300 space-y-2">
//                   <div>
//                     <b>Efficiency:</b>{" "}
//                     {aiResult?.currentCodeEfficiencyInPercentage}%
//                   </div>

//                   <div>
//                     <b>Time Complexity:</b> {aiResult?.timeComplexity}
//                   </div>

//                   <div>
//                     <b>Space Complexity:</b> {aiResult?.spaceComplexity}
//                   </div>

//                   <div>
//                     <b>Issues:</b>
//                     <ul className="list-disc ml-4">
//                       {aiResult?.issues?.map((i, idx) => (
//                         <li key={idx}>{i}</li>
//                       ))}
//                     </ul>
//                   </div>

//                   <div>
//                     <b>Suggestions:</b>
//                     <ul className="list-disc ml-4">
//                       {aiResult?.suggestions?.map((s, idx) => (
//                         <li key={idx}>{s}</li>
//                       ))}
//                     </ul>
//                   </div>

//                   <div>
//                     <b>Optimized Code:</b>
//                     <pre className="bg-black p-2 mt-1 rounded overflow-auto text-green-400">
//                       {aiResult?.optimizedCode}
//                     </pre>
//                   </div>
//                 </div>
//               )}

//               <button
//                 onClick={() => setShowAIBox(false)}
//                 className="mt-3 w-full bg-cyan-600 py-1 rounded text-white"
//               >
//                 Close
//               </button>
//             </div>
//           )}

//           {showCommitBox && (
//             <div className="absolute top-12 right-4 bg-[#1e1e1e] border border-gray-600 p-3 rounded w-64 z-50">
//               <input
//                 value={commitMsg}
//                 onChange={(e) => setCommitMsg(e.target.value)}
//                 placeholder="Commit message"
//                 className="w-full p-2 bg-black text-white border border-gray-600 rounded"
//               />
//               <button
//                 onClick={commitCode}
//                 disabled={commitLoading}
//                 className="mt-2 w-full bg-green-600 text-white py-1 rounded flex items-center justify-center"
//               >
//                 {commitLoading ? (
//                   <span className="flex items-center justify-center gap-2">
//                     <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
//                     Committing...
//                   </span>
//                 ) : (
//                   "Commit"
//                 )}
//               </button>
//             </div>
//           )}

//           {showRestoreBox && (
//             <div className="absolute top-12 right-4 bg-[#1e1e1e] border border-gray-600 p-3 rounded w-64 z-50">
//               <input
//                 value={restoreCommitNo}
//                 onChange={(e) => setRestoreCommitNo(e.target.value)}
//                 placeholder="Commit number"
//                 className="w-full p-2 bg-black text-white border border-gray-600 rounded"
//               />
//               <button
//                 onClick={restoreCode}
//                 disabled={restoreLoading}
//                 className="mt-2 w-full bg-yellow-600 text-white py-1 rounded flex items-center justify-center"
//               >
//                 {restoreLoading ? (
//                   <span className="flex items-center justify-center gap-2">
//                     <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
//                     Restoring...
//                   </span>
//                 ) : (
//                   "Restore"
//                 )}
//               </button>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* MAIN */}
//       <div className="flex flex-1 overflow-hidden">
//         {/* SIDEBAR */}
//         <div
//           style={{ width: sidebarWidth }}
//           className="border-r border-gray-700 flex flex-col overflow-hidden"
//         >
//           <div className="flex-1 overflow-y-auto p-2">
//             <div className="flex items-center justify-between mb-3">
//               <h2 className="text-white font-semibold">Explorer</h2>
//               <div className="flex gap-2">
//                 <button
//                   onClick={() => {
//                     setCreatingFileIn("root");
//                     setCreatingFolderIn(null);
//                   }}
//                   className="bg-[#3c3c3c] text-white px-2 py-1 rounded text-xs"
//                 >
//                   File
//                 </button>
//                 <button
//                   onClick={() => {
//                     setCreatingFolderIn("root");
//                     setCreatingFileIn(null);
//                   }}
//                   className="bg-[#3c3c3c] text-white px-2 py-1 rounded text-xs"
//                 >
//                   Folder
//                 </button>
//               </div>
//             </div>

//             {creatingFileIn === "root" && (
//               <input
//                 autoFocus
//                 placeholder="file"
//                 value={newName}
//                 onChange={(e) => setNewName(e.target.value)}
//                 onKeyDown={async (e) => {
//                   if (e.key === "Enter") {
//                     await createFileApi(null, newName);
//                     setCreatingFileIn(null);
//                     setNewName("");
//                   }
//                 }}
//                 className="w-full mb-2 bg-[#1e1e1e] border border-blue-500 text-white px-2 py-1 rounded text-sm outline-none"
//               />
//             )}

//             {creatingFolderIn === "root" && (
//               <input
//                 autoFocus
//                 placeholder="folder"
//                 value={newName}
//                 onChange={(e) => setNewName(e.target.value)}
//                 onKeyDown={async (e) => {
//                   if (e.key === "Enter") {
//                     await createFolderApi(null, newName);
//                     setCreatingFolderIn(null);
//                     setNewName("");
//                   }
//                 }}
//                 className="w-full mb-2 bg-[#1e1e1e] border border-blue-500 text-white px-2 py-1 rounded text-sm outline-none"
//               />
//             )}

//             {renderTree()}
//           </div>

//           {/* COMMIT HISTORY */}
//           <div className="h-64 border-t border-gray-700 overflow-y-auto p-3">
//             <h2 className="text-white font-semibold mb-3">Commit History</h2>
//             <div className="space-y-4">
//               {history.map((item) => (
//                 <div
//                   key={item.commitNumber}
//                   className="border-l-2 border-green-500 pl-3"
//                 >
//                   <div className="text-white text-sm">
//                     Commit #{item.commitNumber}
//                   </div>
//                   <div className="text-gray-400 text-xs">{item.msg}</div>
//                   <div className="text-gray-500 text-xs">
//                     By {item.createdBy?.username}
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>

//         {/* SIDEBAR RESIZER */}
//         <div
//           className="w-1 bg-gray-700 cursor-col-resize hover:bg-blue-500"
//           onMouseDown={(e) => {
//             const startX = e.clientX;
//             const startWidth = sidebarWidth;
//             const move = (event) =>
//               setSidebarWidth(startWidth + (event.clientX - startX));
//             const up = () => {
//               window.removeEventListener("mousemove", move);
//               window.removeEventListener("mouseup", up);
//             };
//             window.addEventListener("mousemove", move);
//             window.addEventListener("mouseup", up);
//           }}
//         />

//         {/* RIGHT SIDE */}
//         <div className="flex-1 flex flex-col overflow-hidden">
//           <div className="flex-1 overflow-hidden">
//             {selectedFile ? (
//               <Editor
//                 key={`${selectedFile._id}-${selectedFile.name}`}
//                 height="100%"
//                 language={getLanguage(selectedFile.name)}
//                 theme="vs-dark"
//                 onMount={(editor) => {
//                   editorRef.current = editor;
//                   setEditorInstance(editor);
//                 }}
//                 options={{
//                   fontSize: 14,
//                   minimap: { enabled: false },
//                   automaticLayout: true,
//                 }}
//               />
//             ) : (
//               <div className="h-full flex items-center justify-center text-gray-400">
//                 Select file to start coding
//               </div>
//             )}
//           </div>

//           {/* TERMINAL RESIZER */}
//           <div
//             className="h-1 bg-gray-700 cursor-row-resize hover:bg-blue-500"
//             onMouseDown={(e) => {
//               const startY = e.clientY;
//               const startHeight = terminalHeight;
//               const move = (event) =>
//                 setTerminalHeight(startHeight - (event.clientY - startY));
//               const up = () => {
//                 window.removeEventListener("mousemove", move);
//                 window.removeEventListener("mouseup", up);
//               };
//               window.addEventListener("mousemove", move);
//               window.addEventListener("mouseup", up);
//             }}
//           />

//           {/* TERMINAL */}
//           <div
//             style={{ height: terminalHeight }}
//             className="bg-black border-t border-gray-700 flex flex-col"
//           >
//             <div className="h-10 border-b border-gray-700 flex items-center px-3 text-white font-semibold">
//               Terminal
//             </div>
//             <div className="flex-1 flex flex-col overflow-hidden">
//               <div className="flex-1 overflow-y-auto p-3 font-mono text-sm text-green-400 whitespace-pre-wrap break-words">
//                 {logs.map((log, index) => (
//                   <div key={index}>
//                     {typeof log.message === "object"
//                       ? JSON.stringify(log.message, null, 2)
//                       : log.message}
//                   </div>
//                 ))}
//               </div>
//               <div className="border-t border-gray-700 p-2 flex items-start">
//                 <span className="mr-2 text-green-400">{">"}</span>
//                 <textarea
//                   value={input}
//                   onChange={(e) => setInput(e.target.value)}
//                   className="bg-black outline-none flex-1 text-white resize-none h-20"
//                   placeholder="Enter input (stdin)..."
//                 />
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {modalAlert.isOpen && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-fade-in">
//           <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl transition-all">
//             <h3 className="text-xl font-bold text-slate-50">
//               {modalAlert.title}
//             </h3>
//             <p className="mt-3 text-sm text-slate-400 leading-relaxed">
//               {modalAlert.message}
//             </p>
//             <div className="mt-6 flex justify-end">
//               <button
//                 type="button"
//                 onClick={() => {
//                   setModalAlert((prev) => ({ ...prev, isOpen: false }));
//                   if (modalAlert.redirectPath)
//                     navigate(modalAlert.redirectPath);
//                 }}
//                 className="rounded-2xl bg-sky-500 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-md transition hover:bg-sky-400"
//               >
//                 Okay, Understood
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default EditorPage;

import React, {
  useEffect,
  useState,
  useContext,
  useRef,
  useCallback,
} from "react";
import Editor from "@monaco-editor/react";
import axios from "../axios.js";
import { useNavigate, useParams } from "react-router-dom";
import { socket } from "../socket";
import { AuthContext } from "../context/Auth.jsx";

import * as Y from "yjs";
import { MonacoBinding } from "y-monaco";

const CURSOR_COLORS = [
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#96CEB4",
  "#FFEAA7",
  "#DDA0DD",
  "#98D8C8",
  "#F7DC6F",
  "#BB8FCE",
  "#85C1E9",
];

const getUserColor = (userId) => {
  if (!userId) return CURSOR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return CURSOR_COLORS[Math.abs(hash) % CURSOR_COLORS.length];
};

const EditorPage = () => {
  const navigate = useNavigate();
  const { roomId } = useParams();

  const [editorInstance, setEditorInstance] = useState(null);

  const [vercoAILoading, setVercoAILoading] = useState(false);
  const [showAIBox, setShowAIBox] = useState(false);
  const [aiResult, setAiResult] = useState("");

  const [showChatBox, setShowChatBox] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  const editorRef = useRef(null);
  const ydocRef = useRef(null);
  const bindingRef = useRef(null);
  // Store Monaco decorations for remote cursors: { userId -> decorationId[] }
  const cursorDecorationsRef = useRef({});
  // Store widget elements for cursor labels
  const cursorWidgetsRef = useRef({});

  const { user } = useContext(AuthContext);
  const currentUserId = user?._id;

  const [commitLoading, setCommitLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);

  const [commitMsg, setCommitMsg] = useState("");
  const [restoreCommitNo, setRestoreCommitNo] = useState("");
  const [showCommitBox, setShowCommitBox] = useState(false);
  const [showRestoreBox, setShowRestoreBox] = useState(false);

  const [nodes, setNodes] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [input, setInput] = useState("");

  const [logs, setLogs] = useState([
    { message: "SYSTEM: Welcome to Vercodex Terminal" },
  ]);

  const [history, setHistory] = useState([]);

  const [creatingFileIn, setCreatingFileIn] = useState(null);
  const [creatingFolderIn, setCreatingFolderIn] = useState(null);
  const [newName, setNewName] = useState("");
  const [renamingNode, setRenamingNode] = useState(null);

  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [terminalHeight, setTerminalHeight] = useState(220);

  const [modalAlert, setModalAlert] = useState({
    isOpen: false,
    title: "",
    message: "",
    redirectPath: "",
  });

  // Auto-scroll chat to bottom on new messages
  useEffect(() => {
    if (showChatBox && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, showChatBox]);

  useEffect(() => {
    getTree();
  }, []);

  // ================= YJS + SOCKET SYNC =================
  useEffect(() => {
    if (!selectedFile || !editorInstance) return;

    const ydoc = new Y.Doc();
    const ytext = ydoc.getText(selectedFile._id);
    ydocRef.current = ydoc;

    // Register BEFORE join — never miss an update
    const handleRemoteUpdate = (payload) => {
      if (
        payload.docId === selectedFile._id &&
        payload.update &&
        ydocRef.current
      ) {
        try {
          Y.applyUpdate(
            ydocRef.current,
            new Uint8Array(payload.update),
            "remote-sync",
          );
        } catch (error) {
          console.error("Failed to apply Yjs update:", error);
        }
      }
    };
    socket.on("doc-update", handleRemoteUpdate);

    // Send local changes outward
    const updateHandler = (update, origin) => {
      if (origin === "remote-sync") return;
      socket.emit("doc-update", {
        docId: selectedFile._id,
        update: Array.from(update),
      });
    };
    ydoc.on("update", updateHandler);

    socket.emit("join-document", selectedFile._id, (documentState) => {
      if (documentState) {
        Y.applyUpdate(ydoc, new Uint8Array(documentState), "remote-sync");
      } else if (ytext.length === 0 && selectedFile.content) {
        ytext.insert(0, selectedFile.content);
      }

      const model = editorInstance.getModel();
      if (!model) return;

      const binding = new MonacoBinding(
        ytext,
        model,
        new Set([editorInstance]),
        null,
      );
      bindingRef.current = binding;
    });

    return () => {
      socket.emit("leave-document", selectedFile._id);
      ydoc.off("update", updateHandler);
      socket.off("doc-update", handleRemoteUpdate);

      // Clear all cursor decorations on file switch
      clearAllCursorDecorations();

      if (bindingRef.current) {
        bindingRef.current.destroy();
        bindingRef.current = null;
      }

      ydoc.destroy();
      ydocRef.current = null;
    };
  }, [selectedFile, editorInstance]);

  // ================= AUTOSAVE (debounced 3s after last local keystroke) =================
  useEffect(() => {
    if (!selectedFile) return;

    const fileId = selectedFile._id;
    let debounceTimer = null;
    let attached = false;

    const handleTypingStop = (update, origin) => {
      if (origin === "remote-sync") return;
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const content = ydocRef.current?.getText(fileId)?.toString();
        if (content !== undefined) {
          saveContent(fileId, content);
        }
      }, 3000);
    };

    if (ydocRef.current) {
      ydocRef.current.on("update", handleTypingStop);
      attached = true;
    }

    return () => {
      clearTimeout(debounceTimer);
      if (attached && ydocRef.current) {
        ydocRef.current.off("update", handleTypingStop);
      }
    };
  }, [selectedFile, editorInstance]);

  // ================= CURSOR: SEND LOCAL CURSOR POSITION =================
  useEffect(() => {
    if (!editorInstance || !selectedFile || !roomId) return;

    const disposable = editorInstance.onDidChangeCursorPosition((e) => {
      socket.emit("cursor-move", {
        roomId,
        fileId: selectedFile._id,
        position: {
          lineNumber: e.position.lineNumber,
          column: e.position.column,
        },
        selection: editorInstance.getSelection(),
      });
    });

    return () => disposable.dispose();
  }, [editorInstance, selectedFile, roomId]);

  // ================= CURSOR RENDERING HELPERS =================
  const clearAllCursorDecorations = useCallback(() => {
    if (!editorInstance) return;

    Object.keys(cursorDecorationsRef.current).forEach((userId) => {
      try {
        editorInstance.deltaDecorations(
          cursorDecorationsRef.current[userId] || [],
          [],
        );
      } catch (_) {}
    });
    cursorDecorationsRef.current = {};

    Object.values(cursorWidgetsRef.current).forEach((widget) => {
      try {
        editorInstance.removeContentWidget(widget);
      } catch (_) {}
    });
    cursorWidgetsRef.current = {};
  }, [editorInstance]);

  const renderRemoteCursor = useCallback(
    (data) => {
      if (!editorInstance || !data.position) return;

      const { userId, username, position, selection } = data;
      const color = getUserColor(userId);
      const userIdStr = String(userId);

      const decorations = [];

      decorations.push({
        range: {
          startLineNumber: position.lineNumber,
          startColumn: position.column,
          endLineNumber: position.lineNumber,
          endColumn: position.column,
        },
        options: {
          className: `remote-cursor-${userIdStr}`,
          beforeContentClassName: `remote-cursor-before-${userIdStr}`,
        },
      });

      if (
        selection &&
        (selection.startLineNumber !== selection.endLineNumber ||
          selection.startColumn !== selection.endColumn)
      ) {
        decorations.push({
          range: {
            startLineNumber: selection.startLineNumber,
            startColumn: selection.startColumn,
            endLineNumber: selection.endLineNumber,
            endColumn: selection.endColumn,
          },
          options: {
            className: `remote-selection-${userIdStr}`,
            inlineClassName: `remote-selection-inline-${userIdStr}`,
          },
        });
      }

      injectCursorStyle(userIdStr, color);

      const prevDecorations = cursorDecorationsRef.current[userIdStr] || [];
      cursorDecorationsRef.current[userIdStr] = editorInstance.deltaDecorations(
        prevDecorations,
        decorations,
      );

      if (cursorWidgetsRef.current[userIdStr]) {
        try {
          editorInstance.removeContentWidget(
            cursorWidgetsRef.current[userIdStr],
          );
        } catch (_) {}
      }

      const widget = {
        getId: () => `cursor-label-${userIdStr}`,
        getDomNode: () => {
          const node = document.createElement("div");
          node.textContent = username || "User";
          node.style.cssText = `
            background: ${color};
            color: #000;
            font-size: 11px;
            font-weight: 600;
            padding: 1px 5px;
            border-radius: 3px;
            pointer-events: none;
            white-space: nowrap;
            z-index: 100;
            font-family: sans-serif;
          `;
          return node;
        },
        getPosition: () => ({
          position: {
            lineNumber: position.lineNumber,
            column: position.column,
          },
          preference: [
            window.monaco?.editor?.ContentWidgetPositionPreference?.ABOVE,
            window.monaco?.editor?.ContentWidgetPositionPreference?.BELOW,
          ],
        }),
      };

      editorInstance.addContentWidget(widget);
      cursorWidgetsRef.current[userIdStr] = widget;
    },
    [editorInstance],
  );

  useEffect(() => {
    if (!editorInstance || !selectedFile) return;

    const removeRemoteCursor = (userId) => {
      const userIdStr = String(userId);

      if (cursorDecorationsRef.current[userIdStr]) {
        try {
          editorInstance.deltaDecorations(
            cursorDecorationsRef.current[userIdStr],
            [],
          );
        } catch (_) {}
        delete cursorDecorationsRef.current[userIdStr];
      }

      if (cursorWidgetsRef.current[userIdStr]) {
        try {
          editorInstance.removeContentWidget(
            cursorWidgetsRef.current[userIdStr],
          );
        } catch (_) {}
        delete cursorWidgetsRef.current[userIdStr];
      }
    };

    const handleCursorUpdate = (data) => {
      if (String(data.userId) === String(currentUserId)) return;

      if (String(data.fileId) !== String(selectedFile._id)) {
        removeRemoteCursor(data.userId);
        return;
      }

      renderRemoteCursor(data);
    };

    socket.on("cursor-update", handleCursorUpdate);

    return () => {
      socket.off("cursor-update", handleCursorUpdate);
      clearAllCursorDecorations();
    };
  }, [
    editorInstance,
    selectedFile,
    currentUserId,
    renderRemoteCursor,
    clearAllCursorDecorations,
  ]);

  useEffect(() => {
    clearAllCursorDecorations();
  }, [selectedFile]);

  const injectedStylesRef = useRef(new Set());
  const injectCursorStyle = (userIdStr, color) => {
    if (injectedStylesRef.current.has(userIdStr)) return;
    injectedStylesRef.current.add(userIdStr);

    const style = document.createElement("style");
    style.textContent = `
      .remote-cursor-before-${userIdStr}::before {
        content: '';
        display: inline-block;
        width: 2px;
        height: 1.2em;
        background: ${color};
        position: absolute;
        margin-left: -1px;
        pointer-events: none;
      }
      .remote-selection-${userIdStr} {
        background: ${color}33;
      }
    `;
    document.head.appendChild(style);
  };

  // ================= ROOM SOCKET EVENTS =================
  useEffect(() => {
    if (!socket) return;

    if (roomId) {
      socket.emit("join-room", roomId);
    }

    const handleRoomDeleted = () => {
      setModalAlert({
        isOpen: true,
        title: "Workspace Deleted",
        message: "This workspace has been deleted by the owner.",
        redirectPath: "/dashboard/my-rooms",
      });
    };
    socket.on("room-deleted", handleRoomDeleted);

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
    socket.on("member-removed", handleMemberRemoved);

    socket.on("new-file", (file) => {
      setNodes((prev) => {
        if (prev.some((n) => n._id === file._id)) return prev;
        return [
          ...prev,
          {
            _id: file._id,
            name: file.name,
            type: "file",
            parentId: file.parentId,
            roomId: file.roomId,
          },
        ];
      });
    });

    socket.on("new-folder", (folder) => {
      setNodes((prev) => {
        if (prev.some((n) => n._id === folder._id)) return prev;
        return [
          ...prev,
          {
            _id: folder._id,
            name: folder.name,
            type: "folder",
            parentId: folder.parentId,
            roomId: folder.roomId,
          },
        ];
      });
    });

    socket.on("rename-node", (data) => {
      setNodes((prev) =>
        prev.map((node) =>
          node._id === data._id ? { ...node, name: data.newName } : node,
        ),
      );

      setSelectedFile((prev) =>
        prev && prev._id === data._id ? { ...prev, name: data.newName } : prev,
      );
    });

    socket.on("delete-node", (data) => {
      setNodes((prev) => {
        const targetIds = data.deletedNodeIds || [data.nodeId];

        const getChildIds = (idsToMatch, allNodes) => {
          let collected = [...idsToMatch];
          allNodes.forEach((node) => {
            if (node.parentId && idsToMatch.includes(String(node.parentId))) {
              collected.push(...getChildIds([String(node._id)], allNodes));
            }
          });
          return collected;
        };

        const allDeletedIds = getChildIds(targetIds.map(String), prev);

        setSelectedFile((prevFile) => {
          if (prevFile && allDeletedIds.includes(String(prevFile._id)))
            return null;
          return prevFile;
        });

        return prev.filter((n) => !allDeletedIds.includes(String(n._id)));
      });
    });

    return () => {
      socket.off("new-file");
      socket.off("new-folder");
      socket.off("rename-node");
      socket.off("delete-node");
      socket.off("room-deleted", handleRoomDeleted);
      socket.off("member-removed", handleMemberRemoved);
      socket.emit("leave-room", roomId);
    };
  }, [roomId, currentUserId]);

  // ================= COMMIT =================
  const commitCode = async () => {
    try {
      if (!selectedFile || !commitMsg) return;
      setCommitLoading(true);

      await axios.post(
        "https://real-time-code-editor-vercodex.onrender.com/vercodex/commit",
        {
          nodeId: selectedFile._id,
          msg: commitMsg,
          content: ydocRef.current?.getText(selectedFile._id)?.toString() || "",
        },
        { withCredentials: true },
      );

      setCommitMsg("");
      setShowCommitBox(false);
      getCommitHistory(selectedFile._id);
    } catch (error) {
      console.log(error);
    } finally {
      setCommitLoading(false);
    }
  };

  // ================= RESTORE =================
  const restoreCode = async () => {
    try {
      if (!selectedFile || !restoreCommitNo) return;
      setRestoreLoading(true);

      const res = await axios.post(
        "https://real-time-code-editor-vercodex.onrender.com/vercodex/restore-version",
        {
          nodeId: selectedFile._id,
          commitNumber: restoreCommitNo,
        },
        { withCredentials: true },
      );

      const ytext = ydocRef.current?.getText(selectedFile._id);
      if (ytext) {
        ytext.delete(0, ytext.length);
        ytext.insert(0, res.data.data.content || "");
      }

      setShowRestoreBox(false);
      setRestoreCommitNo("");
    } catch (error) {
      console.log(error);
    } finally {
      setRestoreLoading(false);
    }
  };

  // ================= LANGUAGE =================
  const getLanguage = (fileName) => {
    const extension = fileName?.split(".").pop()?.toLowerCase();
    const map = {
      cpp: "cpp",
      cxx: "cpp",
      cc: "cpp",
      c: "c",
      java: "java",
      py: "python",
      js: "javascript",
      ts: "typescript",
      cs: "csharp",
      go: "go",
    };
    return map[extension] || "plaintext";
  };

  // ================= GET TREE =================
  const getTree = async () => {
    try {
      const response = await axios.get(
        `https://real-time-code-editor-vercodex.onrender.com/vercodex/get/room/structure/${roomId}`,
        { withCredentials: true },
      );
      setNodes(response.data.data.nodes);
    } catch (error) {
      console.log(error);
    }
  };

  const createFileApi = async (parentId, name) => {
    try {
      await axios.post(
        "https://real-time-code-editor-vercodex.onrender.com/vercodex/create/file",
        { roomId, parentId, name },
        { withCredentials: true },
      );
    } catch (error) {
      console.log(error);
    }
  };

  const createFolderApi = async (parentId, name) => {
    try {
      await axios.post(
        "https://real-time-code-editor-vercodex.onrender.com/vercodex/create/folder",
        { roomId, parentId, name },
        { withCredentials: true },
      );
    } catch (error) {
      console.log(error);
    }
  };

  const renameNodeApi = async (nodeId, name) => {
    try {
      await axios.patch(
        "https://real-time-code-editor-vercodex.onrender.com/vercodex/rename/node",
        { nodeId, name },
        { withCredentials: true },
      );
    } catch (error) {
      console.log(error);
    }
  };

  const deleteNode = async (nodeId) => {
    try {
      await axios.delete(
        `https://real-time-code-editor-vercodex.onrender.com/vercodex/node/delete/${nodeId}`,
        { withCredentials: true },
      );
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  // ================= SAVE =================
  const saveContent = async (fileId, content) => {
    if (!fileId) return;
    try {
      await axios.post(
        "https://real-time-code-editor-vercodex.onrender.com/vercodex/save/content",
        { nodeId: fileId, content },
        { withCredentials: true },
      );
      console.log("Auto saved");
    } catch (err) {
      console.log("Save failed", err);
    }
  };

  // ================= SAVE ON FILE SWITCH =================
  const handleFileSelect = async (node) => {
    if (!node || node._id === selectedFile?._id) return;

    if (selectedFile && ydocRef.current) {
      const content =
        ydocRef.current.getText(selectedFile._id)?.toString() || "";
      await saveContent(selectedFile._id, content);
    }

    if (bindingRef.current) {
      bindingRef.current.destroy();
      bindingRef.current = null;
    }
    if (ydocRef.current) {
      ydocRef.current.destroy();
      ydocRef.current = null;
    }

    setSelectedFile(node);
    getCommitHistory(node._id);
  };

  // ================= SAVE ON TAB CLOSE =================
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!selectedFile || !ydocRef.current) return;
      const content =
        ydocRef.current.getText(selectedFile._id)?.toString() || "";
      const blob = new Blob(
        [JSON.stringify({ nodeId: selectedFile._id, content })],
        { type: "application/json" },
      );
      navigator.sendBeacon(
        "https://real-time-code-editor-vercodex.onrender.com/vercodex/save/content",
        blob,
      );
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [selectedFile]);

  // ================= COMMIT HISTORY =================
  const getCommitHistory = async (nodeId) => {
    try {
      const response = await axios.get(
        `https://real-time-code-editor-vercodex.onrender.com/vercodex/commit/history?nodeId=${nodeId}`,
        { withCredentials: true },
      );
      setHistory(response.data.data.history);
    } catch (error) {
      console.log(error);
    }
  };

  // ================= RUN =================
  const runCode = async () => {
    try {
      if (!selectedFile) return;
      const response = await axios.post(
        "https://real-time-code-editor-vercodex.onrender.com/vercodex/run/code",
        {
          filename: selectedFile.name,
          code: ydocRef.current?.getText(selectedFile._id)?.toString() || "",
          stdin: input,
        },
        { withCredentials: true },
      );

      const result = response.data.data.result;
      setLogs((prev) => [
        ...prev,
        { message: ">" },
        { message: result.output || "No Output" },
        ...(result.error ? [{ message: `ERROR: ${result.error}` }] : []),
        { message: `TIME: ${result.time}ms | MEMORY: ${result.memory}KB` },
      ]);
    } catch (error) {
      console.log(error);
      setLogs((prev) => [...prev, { message: "ERROR: Execution failed" }]);
    }
  };

  // ================= VERCO AI: CODE ANALYSIS =================
  // State is local to this component instance (per browser tab / per user session).
  // It is never emitted over the socket, so other room members never see it.
  const checkWithVercoAI = async () => {
    try {
      if (!selectedFile) return;

      setVercoAILoading(true);
      // Close chat box if open so both panels don't overlap
      setShowChatBox(false);

      const code = ydocRef.current?.getText(selectedFile._id)?.toString() || "";
      const language = getLanguage(selectedFile.name);

      const res = await axios.post(
        "https://real-time-code-editor-vercodex.onrender.com/vercodex/code/optimize",
        { code, language },
        { withCredentials: true },
      );

      setAiResult(res.data?.data || "No response");
      setShowAIBox(true);
    } catch (err) {
      console.log(err);
      setAiResult(err.message || "AI check failed");
      setShowAIBox(true);
    } finally {
      setVercoAILoading(false);
    }
  };

  // ================= VERCO AI: CHAT BOT =================
  // chatMessages lives only in this component's state — not shared via socket.
  const sendMessageToAI = async () => {
    if (!chatInput.trim() || chatLoading) return;

    const userMessage = chatInput.trim();
    setChatInput("");

    setChatMessages((prev) => [
      ...prev,
      { role: "user", text: userMessage },
      { role: "ai", text: "" },
    ]);

    setChatLoading(true);

    try {
      const res = await fetch(
        "https://real-time-code-editor-vercodex.onrender.com/vercodex/code/chatBot",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ message: userMessage }),
        },
      );

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let aiText = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        aiText += chunk;

        setChatMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            text: aiText,
          };
          return updated;
        });

        const tail = decoder.decode();
        if (tail) {
          aiText += tail;
          setChatMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              text: aiText,
            };
            return updated;
          });
        }
      }
    } catch (err) {
      console.log(err);
      setChatMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          text: "Error generating response",
        };
        return updated;
      });
    } finally {
      setChatLoading(false);
    }
  };

  // ================= TREE =================
  const renderTree = (parentId = null) => {
    return nodes
      .filter((node) => {
        if (parentId === null) return !node.parentId;
        return String(node.parentId) === String(parentId);
      })
      .map((node) => (
        <div key={node._id}>
          <div className="flex items-center justify-between hover:bg-[#2a2d2e] px-2 py-1 rounded text-sm">
            <div
              className="flex items-center gap-2 flex-1 cursor-pointer"
              onClick={() => {
                if (node.type === "file") handleFileSelect(node);
              }}
            >
              <span>{node.type === "folder" ? "📁" : "📄"}</span>

              {renamingNode === node._id ? (
                <input
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={async (e) => {
                    if (e.key === "Enter") {
                      await renameNodeApi(node._id, newName);
                      setRenamingNode(null);
                      setNewName("");
                    }
                  }}
                  className="bg-[#1e1e1e] text-white text-sm outline-none border border-blue-500 px-1 rounded"
                />
              ) : (
                <span className="text-white">{node.name}</span>
              )}
            </div>

            <div className="flex gap-1">
              {node.type === "folder" && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCreatingFileIn(node._id);
                      setCreatingFolderIn(null);
                      setNewName("");
                    }}
                    className="bg-[#3c3c3c] text-white px-1 rounded text-xs"
                  >
                    +F
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCreatingFolderIn(node._id);
                      setCreatingFileIn(null);
                      setNewName("");
                    }}
                    className="bg-[#3c3c3c] text-white px-1 rounded text-xs"
                  >
                    +D
                  </button>
                </>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setRenamingNode(node._id);
                  setNewName(node.name);
                }}
                className="bg-blue-600 text-white px-1 rounded text-xs"
              >
                R
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteNode(node._id);
                }}
                className="bg-red-600 text-white px-1 rounded text-xs"
              >
                X
              </button>
            </div>
          </div>

          {creatingFileIn === node._id && (
            <div className="ml-6 mt-1">
              <input
                autoFocus
                placeholder="file"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={async (e) => {
                  if (e.key === "Enter") {
                    await createFileApi(node._id, newName);
                    setCreatingFileIn(null);
                    setNewName("");
                  }
                }}
                className="bg-[#1e1e1e] border border-blue-500 text-white px-2 py-1 rounded text-sm outline-none"
              />
            </div>
          )}

          {creatingFolderIn === node._id && (
            <div className="ml-6 mt-1">
              <input
                autoFocus
                placeholder="folder"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={async (e) => {
                  if (e.key === "Enter") {
                    await createFolderApi(node._id, newName);
                    setCreatingFolderIn(null);
                    setNewName("");
                  }
                }}
                className="bg-[#1e1e1e] border border-blue-500 text-white px-2 py-1 rounded text-sm outline-none"
              />
            </div>
          )}

          {node.type === "folder" && (
            <div className="ml-4 border-l border-gray-700 pl-2">
              {renderTree(node._id)}
            </div>
          )}
        </div>
      ));
  };

  useEffect(() => {
    const handleClick = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "BUTTON") return;
      setCreatingFileIn(null);
      setCreatingFolderIn(null);
      setRenamingNode(null);
      setNewName("");
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "BUTTON") return;
      setShowCommitBox(false);
      setShowRestoreBox(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ================= RENDER =================
  return (
    <div className="h-screen bg-[#1e1e1e] flex flex-col overflow-hidden">
      {/* HEADER */}
      <div className="h-12 border-b border-gray-700 flex items-center px-4 gap-2 relative">
        {/* Left controls */}
        <button
          onClick={runCode}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-1 rounded"
        >
          Run
        </button>
        <button
          onClick={() => navigate(`/chat/${roomId}`)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded"
        >
          Chat
        </button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right AI + version controls — all siblings at the same level */}
        <div className="flex items-center gap-2 relative">
          {/* VercoAI Chat toggle */}
          <button
            onClick={() => {
              setShowChatBox((prev) => {
                const next = !prev;
                // Close analysis panel when opening chat
                if (next) setShowAIBox(false);
                return next;
              });
            }}
            className={`px-3 py-1 rounded text-white text-sm ${
              showChatBox
                ? "bg-cyan-700 ring-1 ring-cyan-400"
                : "bg-cyan-600 hover:bg-cyan-700"
            }`}
          >
            VercoAI
          </button>

          {/* Code Analysis */}
          <button
            onClick={checkWithVercoAI}
            disabled={vercoAILoading}
            className="bg-cyan-600 hover:bg-cyan-700 disabled:opacity-60 text-white px-3 py-1 rounded text-sm"
          >
            {vercoAILoading ? "Checking..." : "Analysis"}
          </button>

          {/* Commit */}
          <button
            onClick={() => {
              setShowCommitBox((prev) => !prev);
              setShowRestoreBox(false);
              setShowAIBox(false);
              setShowChatBox(false);
            }}
            className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm"
          >
            Commit
          </button>

          {/* Restore */}
          <button
            onClick={() => {
              setShowRestoreBox((prev) => !prev);
              setShowCommitBox(false);
              setShowAIBox(false);
              setShowChatBox(false);
            }}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm"
          >
            Restore
          </button>

          {/* ── VercoAI CHAT PANEL ── */}
          {showChatBox && (
            <div
              className="absolute top-10 right-0 bg-[#252526] border border-gray-600 rounded-lg w-96 z-50 flex flex-col shadow-2xl"
              style={{ height: 420 }}
              // Stop clicks inside the panel from bubbling to the
              // document-level mousedown handler that closes commit/restore boxes
              onMouseDown={(e) => e.stopPropagation()}
            >
              {/* Panel header */}
              <div className="flex items-center justify-between px-3 py-2 border-b border-gray-600 shrink-0">
                <span className="text-white font-semibold text-sm">
                  VercoAI Chat
                </span>
                <button
                  onClick={() => setShowChatBox(false)}
                  className="text-gray-400 hover:text-white text-xs"
                >
                  ✖
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3 text-sm">
                {chatMessages.length === 0 && (
                  <p className="text-gray-500 text-xs text-center mt-4">
                    Ask VercoAI anything about your code…
                  </p>
                )}
                {/* {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col gap-0.5 ${msg.role === "user" ? "items-end" : "items-start"}`}
                  >
                    <span className="text-xs text-gray-500">
                      {msg.role === "user" ? "You" : "VercoAI"}
                    </span>
                    <div
                      className={`px-3 py-2 rounded-lg max-w-[85%] text-sm whitespace-pre-wrap break-words ${
                        msg.role === "user"
                          ? "bg-cyan-700 text-white"
                          : "bg-[#2d2d2d] text-gray-200"
                      }`}
                    >
                      {msg.text || (
                        <span className="text-gray-500 italic">Thinking…</span>
                      )}
                    </div>
                  </div>
                ))} */}

                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col gap-0.5 ${msg.role === "user" ? "items-end" : "items-start"}`}
                  >
                    <span className="text-xs text-gray-500">
                      {msg.role === "user" ? "You" : "VercoAI"}
                    </span>
                    <div
                      className={`px-3 py-2 rounded-lg max-w-[85%] text-sm break-words ${
                        msg.role === "user"
                          ? "bg-cyan-700 text-white"
                          : "bg-[#2d2d2d] text-gray-200"
                      }`}
                    >
                      {msg.text ? (
                        <ReactMarkdown
                          components={{
                            // Code blocks  ← ```cpp ... ```
                            code({
                              node,
                              inline,
                              className,
                              children,
                              ...props
                            }) {
                              return inline ? (
                                // Inline code  ← `code`
                                <code
                                  className="bg-black/40 text-cyan-300 px-1 py-0.5 rounded text-xs font-mono"
                                  {...props}
                                >
                                  {children}
                                </code>
                              ) : (
                                <pre className="bg-black rounded-lg p-3 overflow-x-auto mt-2 mb-2">
                                  <code
                                    className="text-green-400 text-xs font-mono whitespace-pre"
                                    {...props}
                                  >
                                    {children}
                                  </code>
                                </pre>
                              );
                            },
                            // Tables
                            table({ children }) {
                              return (
                                <div className="overflow-x-auto my-2">
                                  <table className="text-xs border-collapse w-full">
                                    {children}
                                  </table>
                                </div>
                              );
                            },
                            th({ children }) {
                              return (
                                <th className="border border-gray-600 px-3 py-1 bg-[#1e1e1e] text-gray-300 text-left">
                                  {children}
                                </th>
                              );
                            },
                            td({ children }) {
                              return (
                                <td className="border border-gray-600 px-3 py-1 text-gray-300">
                                  {children}
                                </td>
                              );
                            },
                            // Headings
                            h1({ children }) {
                              return (
                                <h1 className="text-base font-bold text-white mt-3 mb-1">
                                  {children}
                                </h1>
                              );
                            },
                            h2({ children }) {
                              return (
                                <h2 className="text-sm font-bold text-white mt-3 mb-1">
                                  {children}
                                </h2>
                              );
                            },
                            h3({ children }) {
                              return (
                                <h3 className="text-sm font-semibold text-cyan-400 mt-2 mb-1">
                                  {children}
                                </h3>
                              );
                            },
                            // Lists
                            ul({ children }) {
                              return (
                                <ul className="list-disc ml-4 space-y-0.5 text-gray-300">
                                  {children}
                                </ul>
                              );
                            },
                            ol({ children }) {
                              return (
                                <ol className="list-decimal ml-4 space-y-0.5 text-gray-300">
                                  {children}
                                </ol>
                              );
                            },
                            // Bold / strong
                            strong({ children }) {
                              return (
                                <strong className="text-white font-semibold">
                                  {children}
                                </strong>
                              );
                            },
                            // Paragraphs
                            p({ children }) {
                              return (
                                <p className="mb-1 leading-relaxed">
                                  {children}
                                </p>
                              );
                            },
                          }}
                        >
                          {msg.text}
                        </ReactMarkdown>
                      ) : (
                        <span className="text-gray-500 italic">Thinking…</span>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* Input row */}
              <div className="px-3 py-2 border-t border-gray-600 flex gap-2 shrink-0">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessageToAI();
                    }
                  }}
                  disabled={chatLoading}
                  className="flex-1 px-2 py-1.5 bg-black text-white border border-gray-600 rounded text-sm outline-none disabled:opacity-50"
                  placeholder="Ask VercoAI… (Enter to send)"
                />
                <button
                  onClick={sendMessageToAI}
                  disabled={chatLoading || !chatInput.trim()}
                  className="bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 px-3 py-1.5 rounded text-white text-sm"
                >
                  {chatLoading ? "…" : "Send"}
                </button>
              </div>
            </div>
          )}

          {/* ── ANALYSIS PANEL ── */}
          {showAIBox && (
            <div
              className="absolute top-10 right-0 bg-[#252526] border border-gray-600 p-3 rounded-lg w-96 z-50 shadow-2xl overflow-y-auto"
              style={{ maxHeight: 420 }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-white font-semibold text-sm">
                  Code Analysis
                </span>
                <button
                  onClick={() => setShowAIBox(false)}
                  className="text-gray-400 hover:text-white text-xs"
                >
                  ✖
                </button>
              </div>

              {aiResult?.error ? (
                <div className="text-red-400 text-sm">{aiResult.error}</div>
              ) : (
                <div className="text-xs text-gray-300 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Efficiency</span>
                    <div className="flex-1 bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-cyan-500 h-2 rounded-full"
                        style={{
                          width: `${aiResult?.currentCodeEfficiencyInPercentage ?? 0}%`,
                        }}
                      />
                    </div>
                    <span className="text-cyan-400 font-semibold">
                      {aiResult?.currentCodeEfficiencyInPercentage}%
                    </span>
                  </div>

                  <div>
                    <span className="text-gray-400">Time Complexity: </span>
                    <span className="text-white">
                      {aiResult?.timeComplexity}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Space Complexity: </span>
                    <span className="text-white">
                      {aiResult?.spaceComplexity}
                    </span>
                  </div>

                  {aiResult?.issues?.length > 0 && (
                    <div>
                      <div className="text-gray-400 mb-1 font-semibold">
                        Issues
                      </div>
                      <ul className="list-disc ml-4 space-y-0.5">
                        {aiResult.issues.map((i, idx) => (
                          <li key={idx} className="text-red-400">
                            {i}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {aiResult?.suggestions?.length > 0 && (
                    <div>
                      <div className="text-gray-400 mb-1 font-semibold">
                        Suggestions
                      </div>
                      <ul className="list-disc ml-4 space-y-0.5">
                        {aiResult.suggestions.map((s, idx) => (
                          <li key={idx} className="text-green-400">
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {aiResult?.optimizedCode && (
                    <div>
                      <div className="text-gray-400 mb-1 font-semibold">
                        Optimized Code
                      </div>
                      <pre className="bg-black p-2 rounded overflow-auto text-green-400 text-xs max-h-48">
                        {aiResult.optimizedCode}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── COMMIT BOX ── */}
          {showCommitBox && (
            <div className="absolute top-10 right-0 bg-[#1e1e1e] border border-gray-600 p-3 rounded w-64 z-50">
              <input
                value={commitMsg}
                onChange={(e) => setCommitMsg(e.target.value)}
                placeholder="Commit message"
                className="w-full p-2 bg-black text-white border border-gray-600 rounded"
              />
              <button
                onClick={commitCode}
                disabled={commitLoading}
                className="mt-2 w-full bg-green-600 text-white py-1 rounded flex items-center justify-center"
              >
                {commitLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Committing...
                  </span>
                ) : (
                  "Commit"
                )}
              </button>
            </div>
          )}

          {/* ── RESTORE BOX ── */}
          {showRestoreBox && (
            <div className="absolute top-10 right-0 bg-[#1e1e1e] border border-gray-600 p-3 rounded w-64 z-50">
              <input
                value={restoreCommitNo}
                onChange={(e) => setRestoreCommitNo(e.target.value)}
                placeholder="Commit number"
                className="w-full p-2 bg-black text-white border border-gray-600 rounded"
              />
              <button
                onClick={restoreCode}
                disabled={restoreLoading}
                className="mt-2 w-full bg-yellow-600 text-white py-1 rounded flex items-center justify-center"
              >
                {restoreLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Restoring...
                  </span>
                ) : (
                  "Restore"
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MAIN */}
      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR */}
        <div
          style={{ width: sidebarWidth }}
          className="border-r border-gray-700 flex flex-col overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto p-2">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-white font-semibold">Explorer</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setCreatingFileIn("root");
                    setCreatingFolderIn(null);
                  }}
                  className="bg-[#3c3c3c] text-white px-2 py-1 rounded text-xs"
                >
                  File
                </button>
                <button
                  onClick={() => {
                    setCreatingFolderIn("root");
                    setCreatingFileIn(null);
                  }}
                  className="bg-[#3c3c3c] text-white px-2 py-1 rounded text-xs"
                >
                  Folder
                </button>
              </div>
            </div>

            {creatingFileIn === "root" && (
              <input
                autoFocus
                placeholder="file"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={async (e) => {
                  if (e.key === "Enter") {
                    await createFileApi(null, newName);
                    setCreatingFileIn(null);
                    setNewName("");
                  }
                }}
                className="w-full mb-2 bg-[#1e1e1e] border border-blue-500 text-white px-2 py-1 rounded text-sm outline-none"
              />
            )}

            {creatingFolderIn === "root" && (
              <input
                autoFocus
                placeholder="folder"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={async (e) => {
                  if (e.key === "Enter") {
                    await createFolderApi(null, newName);
                    setCreatingFolderIn(null);
                    setNewName("");
                  }
                }}
                className="w-full mb-2 bg-[#1e1e1e] border border-blue-500 text-white px-2 py-1 rounded text-sm outline-none"
              />
            )}

            {renderTree()}
          </div>

          {/* COMMIT HISTORY */}
          <div className="h-64 border-t border-gray-700 overflow-y-auto p-3">
            <h2 className="text-white font-semibold mb-3">Commit History</h2>
            <div className="space-y-4">
              {history.map((item) => (
                <div
                  key={item.commitNumber}
                  className="border-l-2 border-green-500 pl-3"
                >
                  <div className="text-white text-sm">
                    Commit #{item.commitNumber}
                  </div>
                  <div className="text-gray-400 text-xs">{item.msg}</div>
                  <div className="text-gray-500 text-xs">
                    By {item.createdBy?.username}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SIDEBAR RESIZER */}
        <div
          className="w-1 bg-gray-700 cursor-col-resize hover:bg-blue-500"
          onMouseDown={(e) => {
            const startX = e.clientX;
            const startWidth = sidebarWidth;
            const move = (event) =>
              setSidebarWidth(startWidth + (event.clientX - startX));
            const up = () => {
              window.removeEventListener("mousemove", move);
              window.removeEventListener("mouseup", up);
            };
            window.addEventListener("mousemove", move);
            window.addEventListener("mouseup", up);
          }}
        />

        {/* RIGHT SIDE */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden">
            {selectedFile ? (
              <Editor
                key={`${selectedFile._id}-${selectedFile.name}`}
                height="100%"
                language={getLanguage(selectedFile.name)}
                theme="vs-dark"
                onMount={(editor) => {
                  editorRef.current = editor;
                  setEditorInstance(editor);
                }}
                options={{
                  fontSize: 14,
                  minimap: { enabled: false },
                  automaticLayout: true,
                }}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                Select file to start coding
              </div>
            )}
          </div>

          {/* TERMINAL RESIZER */}
          <div
            className="h-1 bg-gray-700 cursor-row-resize hover:bg-blue-500"
            onMouseDown={(e) => {
              const startY = e.clientY;
              const startHeight = terminalHeight;
              const move = (event) =>
                setTerminalHeight(startHeight - (event.clientY - startY));
              const up = () => {
                window.removeEventListener("mousemove", move);
                window.removeEventListener("mouseup", up);
              };
              window.addEventListener("mousemove", move);
              window.addEventListener("mouseup", up);
            }}
          />

          {/* TERMINAL */}
          <div
            style={{ height: terminalHeight }}
            className="bg-black border-t border-gray-700 flex flex-col"
          >
            <div className="h-10 border-b border-gray-700 flex items-center px-3 text-white font-semibold">
              Terminal
            </div>
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-3 font-mono text-sm text-green-400 whitespace-pre-wrap break-words">
                {logs.map((log, index) => (
                  <div key={index}>
                    {typeof log.message === "object"
                      ? JSON.stringify(log.message, null, 2)
                      : log.message}
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-700 p-2 flex items-start">
                <span className="mr-2 text-green-400">{">"}</span>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="bg-black outline-none flex-1 text-white resize-none h-20"
                  placeholder="Enter input (stdin)..."
                />
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
                  if (modalAlert.redirectPath)
                    navigate(modalAlert.redirectPath);
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

export default EditorPage;
