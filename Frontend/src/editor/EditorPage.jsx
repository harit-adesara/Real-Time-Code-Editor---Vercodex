// import React, { useEffect, useState, useContext, useRef } from "react";
// import Editor from "@monaco-editor/react";
// import axios from "axios";
// import { useNavigate, useParams } from "react-router-dom";
// import { socket } from "../socket";
// import { AuthContext } from "../context/Auth.jsx";

// import * as Y from "yjs";
// import { MonacoBinding } from "y-monaco";

// const EditorPage = () => {
//   const navigate = useNavigate();
//   const { roomId } = useParams();

//   // Add this right below your editorRef/ydocRef declarations
//   const [editorInstance, setEditorInstance] = useState(null);

//   const editorRef = useRef(null);
//   const ydocRef = useRef(null);
//   const bindingRef = useRef(null);

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
//   // const [code, setCode] = useState("");
//   const [input, setInput] = useState("");

//   const [logs, setLogs] = useState([
//     { message: "SYSTEM: Welcome to Vercodex Terminal" },
//   ]);

//   const [history, setHistory] = useState([]);

//   const [creatingFileIn, setCreatingFileIn] = useState(null);
//   const [creatingFolderIn, setCreatingFolderIn] = useState(null);
//   const [newName, setNewName] = useState("");
//   const [renamingNode, setRenamingNode] = useState(null);

//   // RESIZE
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

//   // socket

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
//         // Backend has live Yjs state — apply it (includes all edits so far)
//         Y.applyUpdate(ydoc, new Uint8Array(documentState), "remote-sync");
//       } else if (ytext.length === 0 && selectedFile.content) {
//         // No live session yet — seed from DB stored content
//         ytext.insert(0, selectedFile.content);
//       }

//       // Bind Monaco after state is ready
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

//       if (bindingRef.current) {
//         bindingRef.current.destroy();
//         bindingRef.current = null;
//       }

//       ydoc.destroy();
//       ydocRef.current = null;
//     };
//   }, [selectedFile, editorInstance]); // CRITICAL: Added editorInstance here

//   // ================= AUTOSAVE (debounced 3s after last keystroke) =================

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
//   }, [selectedFile, editorInstance]);

//   // useEffect(() => {
//   //   if (!selectedFile) return;

//   //   let debounceTimer = null;

//   //   const handleTypingStop = (update, origin) => {
//   //     // Don't trigger save on remote updates, only local typing
//   //     if (origin === "remote-sync") return;

//   //     clearTimeout(debounceTimer);
//   //     debounceTimer = setTimeout(() => {
//   //       const content = ydocRef.current?.getText(selectedFile._id)?.toString();
//   //       if (content !== undefined) {
//   //         saveContent(selectedFile._id, content);
//   //       }
//   //     }, 3000);
//   //   };

//   //   // Wait until ydoc is ready (it's set in the other useEffect)
//   //   // Poll briefly for ydocRef since it's set async inside join-document callback
//   //   const attachObserver = () => {
//   //     if (ydocRef.current) {
//   //       ydocRef.current.on("update", handleTypingStop);
//   //     } else {
//   //       // Retry after short delay until ydoc is initialized
//   //       setTimeout(attachObserver, 100);
//   //     }
//   //   };

//   //   attachObserver();

//   //   return () => {
//   //     clearTimeout(debounceTimer);
//   //     if (ydocRef.current) {
//   //       ydocRef.current.off("update", handleTypingStop);
//   //     }
//   //   };
//   // }, [selectedFile]);

//   useEffect(() => {
//     if (!socket) return;

//     if (roomId) {
//       socket.emit("join-room", roomId);
//     }

//     const handleRoomDeleted = () => {
//       console.log("The owner has deleted this workspace room.");
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

//     // ========== NEW FILE ==========
//     socket.on("new-file", (file) => {
//       setNodes((prev) => {
//         const exists = prev.some((n) => n._id === file._id);
//         if (exists) return prev;

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

//     // ========== NEW FOLDER ==========
//     socket.on("new-folder", (folder) => {
//       setNodes((prev) => {
//         const exists = prev.some((n) => n._id === folder._id);
//         if (exists) return prev;

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

//     // ========== RENAME ==========
//     socket.on("rename-node", (data) => {
//       setNodes((prev) =>
//         prev.map((node) =>
//           node._id === data._id ? { ...node, name: data.newName } : node,
//         ),
//       );
//     });

//     // ========== DELETE ==========
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
//           if (prevFile && allDeletedIds.includes(String(prevFile._id))) {
//             return null;
//           }
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
//       socket.off("room-deleted");
//       socket.emit("leave-room", roomId);
//       socket.off("member-removed", handleMemberRemoved);
//     };
//   }, [roomId, currentUserId]);

//   const commitCode = async () => {
//     try {
//       if (!selectedFile || !commitMsg) return;

//       setCommitLoading(true);

//       await axios.post(
//         "http://localhost:3000/vercodex/commit",
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

//   const restoreCode = async () => {
//     try {
//       if (!selectedFile || !restoreCommitNo) return;

//       setRestoreLoading(true);

//       const res = await axios.post(
//         "http://localhost:3000/vercodex/restore-version",
//         {
//           nodeId: selectedFile._id,
//           commitNumber: restoreCommitNo,
//         },
//         { withCredentials: true },
//       );

//       const ytext = ydocRef.current?.getText(selectedFile._id);

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
//         `http://localhost:3000/vercodex/get/room/structure/${roomId}`,
//         {
//           withCredentials: true,
//         },
//       );

//       setNodes(response.data.data.nodes);
//     } catch (error) {
//       console.log(error);
//     }
//   };

//   // ================= CREATE FILE API =================

//   const createFileApi = async (parentId, name) => {
//     try {
//       console.log(roomId);
//       console.log(parentId);
//       console.log(roomId);

//       const response = await axios.post(
//         "http://localhost:3000/vercodex/create/file",
//         {
//           roomId,
//           parentId,
//           name,
//         },
//         {
//           withCredentials: true,
//         },
//       );

//       // setNodes((prev) => [...prev, response.data.data.file]);
//     } catch (error) {
//       console.log(error);
//     }
//   };

//   // ================= CREATE FOLDER API =================

//   const createFolderApi = async (parentId, name) => {
//     try {
//       const response = await axios.post(
//         "http://localhost:3000/vercodex/create/folder",
//         {
//           roomId,
//           parentId,
//           name,
//         },
//         {
//           withCredentials: true,
//         },
//       );

//       // setNodes((prev) => [...prev, response.data.data.folder]);
//     } catch (error) {
//       console.log(error);
//     }
//   };

//   // ================= RENAME API =================

//   const renameNodeApi = async (nodeId, name) => {
//     try {
//       await axios.patch(
//         "http://localhost:3000/vercodex/rename/node",
//         {
//           nodeId,
//           name,
//         },
//         {
//           withCredentials: true,
//         },
//       );

//       // setNodes((prev) =>
//       //   prev.map((node) =>
//       //     node._id === nodeId
//       //       ? {
//       //           ...node,
//       //           name,
//       //         }
//       //       : node,
//       //   ),
//       // );
//     } catch (error) {
//       console.log(error);
//     }
//   };

//   // ================= DELETE =================

//   const deleteNode = async (nodeId) => {
//     try {
//       // Only make the API request. The socket event will handle updating the UI.
//       await axios.delete(
//         `http://localhost:3000/vercodex/node/delete/${nodeId}`,
//         { withCredentials: true },
//       );

//       console.log("Delete request sent successfully");
//     } catch (error) {
//       console.error("Delete failed:", error);
//     }
//   };

//   // ================= SAVE =================

//   const saveContent = async (fileId, content) => {
//     if (!fileId) return;

//     try {
//       await axios.post(
//         "http://localhost:3000/vercodex/save/content",
//         {
//           nodeId: fileId,
//           content,
//         },
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

//     // Save current file before switching
//     if (selectedFile && ydocRef.current) {
//       const content =
//         ydocRef.current.getText(selectedFile._id)?.toString() || "";
//       await saveContent(selectedFile._id, content);
//     }

//     // Cleanup current Yjs session
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

//       // sendBeacon needs plain text or FormData — JSON string works
//       const blob = new Blob(
//         [JSON.stringify({ nodeId: selectedFile._id, content })],
//         { type: "application/json" },
//       );

//       navigator.sendBeacon("http://localhost:3000/vercodex/save/content", blob);
//     };

//     window.addEventListener("beforeunload", handleBeforeUnload);
//     return () => window.removeEventListener("beforeunload", handleBeforeUnload);
//   }, [selectedFile]); // selectedFile ref is enough — ydocRef is a ref, always current

//   // ================= COMMIT HISTORY =================

//   const getCommitHistory = async (nodeId) => {
//     try {
//       const response = await axios.get(
//         `http://localhost:3000/vercodex/commit/history?nodeId=${nodeId}`,
//         {
//           withCredentials: true,
//         },
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
//         "http://localhost:3000/vercodex/run/code",
//         {
//           filename: selectedFile.name,
//           code: ydocRef.current?.getText(selectedFile._id)?.toString() || "",
//           stdin: input,
//         },
//         {
//           withCredentials: true,
//         },
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

//       setLogs((prev) => [
//         ...prev,
//         {
//           message: "ERROR: Execution failed",
//         },
//       ]);
//     }
//   };

//   // ================= TREE =================

//   const renderTree = (parentId = null) => {
//     return nodes

//       .filter((node) => {
//         if (parentId === null) {
//           return !node.parentId;
//         }

//         return String(node.parentId) === String(parentId);
//       })

//       .map((node) => (
//         <div key={node._id}>
//           <div className="flex items-center justify-between hover:bg-[#2a2d2e] px-2 py-1 rounded text-sm">
//             {/* LEFT */}

//             <div
//               className="flex items-center gap-2 flex-1 cursor-pointer"
//               onClick={() => {
//                 if (node.type === "file") {
//                   handleFileSelect(node);
//                 }
//               }}
//             >
//               <span>{node.type === "folder" ? "📁" : "📄"}</span>

//               {/* RENAME */}

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

//             {/* RIGHT */}

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

//           {/* CREATE FILE */}

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

//           {/* CREATE FOLDER */}

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

//           {/* CHILDREN */}

//           {node.type === "folder" && (
//             <div className="ml-4 border-l border-gray-700 pl-2">
//               {renderTree(node._id)}
//             </div>
//           )}
//         </div>
//       ));
//   };

//   // ================= LOAD =================

//   useEffect(() => {
//     const handleClick = (e) => {
//       // if click is inside a create/rename input OR file tree actions → DO NOTHING
//       const isInput = e.target.tagName === "INPUT";
//       const isButton = e.target.tagName === "BUTTON";

//       if (isInput || isButton) return;

//       setCreatingFileIn(null);
//       setCreatingFolderIn(null);
//       setRenamingNode(null);
//       setNewName("");
//     };

//     document.addEventListener("mousedown", handleClick);

//     return () => {
//       document.removeEventListener("mousedown", handleClick);
//     };
//   }, []);

//   useEffect(() => {
//     const handleClickOutside = (e) => {
//       const isInput = e.target.tagName === "INPUT";
//       const isButton = e.target.tagName === "BUTTON";

//       // if clicking inside UI elements → ignore
//       if (isInput || isButton) return;

//       setShowCommitBox(false);
//       setShowRestoreBox(false);
//     };

//     document.addEventListener("mousedown", handleClickOutside);

//     return () => {
//       document.removeEventListener("mousedown", handleClickOutside);
//     };
//   }, []);

//   return (
//     <div className="h-screen bg-[#1e1e1e] flex flex-col overflow-hidden">
//       {/* HEADER */}

//       <div className="h-12 border-b border-gray-700 flex items-center px-4 relative">
//         {/* LEFT SIDE (keep empty or future tools) */}
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

//         {/* RIGHT SIDE */}
//         <div className="flex items-center gap-2 relative">
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

//           {/* COMMIT BOX */}
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

//           {/* RESTORE BOX */}
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
//           style={{
//             width: sidebarWidth,
//           }}
//           className="border-r border-gray-700 flex flex-col overflow-hidden"
//         >
//           {/* EXPLORER */}

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

//             {/* ROOT CREATE FILE */}

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

//             {/* ROOT CREATE FOLDER */}

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

//             const move = (event) => {
//               setSidebarWidth(startWidth + (event.clientX - startX));
//             };

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
//           {/* EDITOR */}

//           <div className="flex-1 overflow-hidden">
//             {selectedFile ? (
//               <Editor
//                 key={selectedFile._id}
//                 height="100%"
//                 language={getLanguage(selectedFile.name)}
//                 theme="vs-dark"
//                 onMount={(editor) => {
//                   editorRef.current = editor;
//                   setEditorInstance(editor);
//                 }}
//                 options={{
//                   fontSize: 14,
//                   minimap: {
//                     enabled: false,
//                   },
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

//               const move = (event) => {
//                 setTerminalHeight(startHeight - (event.clientY - startY));
//               };

//               const up = () => {
//                 window.removeEventListener("mousemove", move);

//                 window.removeEventListener("mouseup", up);
//               };

//               window.addEventListener("mousemove", move);

//               window.addEventListener("mouseup", up);
//             }}
//           />

//           {/* TERMINAL */}

//           {/* TERMINAL */}

//           <div
//             style={{
//               height: terminalHeight,
//             }}
//             className="bg-black border-t border-gray-700 flex flex-col"
//           >
//             {/* HEADER */}
//             <div className="h-10 border-b border-gray-700 flex items-center px-3 text-white font-semibold">
//               Terminal
//             </div>

//             {/* OUTPUT + INPUT SPLIT */}
//             <div className="flex-1 flex flex-col overflow-hidden">
//               {/* OUTPUT SECTION */}
//               <div className="flex-1 overflow-y-auto p-3 font-mono text-sm text-green-400 whitespace-pre-wrap break-words">
//                 {" "}
//                 {logs.map((log, index) => (
//                   <div key={index}>
//                     {typeof log.message === "object"
//                       ? JSON.stringify(log.message, null, 2)
//                       : log.message}
//                   </div>
//                 ))}
//               </div>

//               {/* INPUT SECTION */}
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
//                   if (modalAlert.redirectPath) {
//                     navigate(modalAlert.redirectPath);
//                   }
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
import axios from "axios";
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

    // Keep a stable ref to the fileId so the timeout closure is safe
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

    // Attach once ydoc is ready — use the ref directly, no risky polling
    // The Yjs effect always runs before this one (same dep change),
    // but ydocRef is set synchronously at top of that effect so it's ready here
    if (ydocRef.current) {
      ydocRef.current.on("update", handleTypingStop);
      attached = true;
    }

    return () => {
      clearTimeout(debounceTimer);
      // Only call .off if we successfully attached AND ydoc still exists
      if (attached && ydocRef.current) {
        ydocRef.current.off("update", handleTypingStop);
      }
    };
  }, [selectedFile, editorInstance]); // editorInstance dep ensures ydoc is ready

  // ================= CURSOR: SEND LOCAL CURSOR POSITION =================

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
  // useEffect(() => {
  //   if (!editorInstance || !selectedFile || !roomId) return;

  //   const disposable = editorInstance.onDidChangeCursorPosition((e) => {
  //     socket.emit("cursor-move", {
  //       roomId,
  //       position: {
  //         lineNumber: e.position.lineNumber,
  //         column: e.position.column,
  //       },
  //       selection: editorInstance.getSelection(),
  //     });
  //   });

  //   return () => disposable.dispose();
  // }, [editorInstance, selectedFile, roomId]);

  // ================= CURSOR: RECEIVE REMOTE CURSORS =================
  // useEffect(() => {
  //   if (!editorInstance) return;

  //   const handleCursorUpdate = (data) => {
  //     // Don't render your own cursor
  //     if (String(data.userId) === String(currentUserId)) return;

  //     renderRemoteCursor(data);
  //   };

  //   socket.on("cursor-update", handleCursorUpdate);

  //   return () => {
  //     socket.off("cursor-update", handleCursorUpdate);
  //     clearAllCursorDecorations();
  //   };
  // }, [editorInstance, currentUserId]);

  // ================= CURSOR: RECEIVE REMOTE CURSORS =================
  // useEffect(() => {
  //   if (!editorInstance || !selectedFile) return;

  //   const handleCursorUpdate = (data) => {
  //     // Ignore own cursor
  //     if (String(data.userId) === String(currentUserId)) return;

  //     // Ignore other file cursors
  //     if (String(data.fileId) !== String(selectedFile._id)) return;

  //     renderRemoteCursor(data);
  //   };

  //   socket.on("cursor-update", handleCursorUpdate);

  //   return () => {
  //     socket.off("cursor-update", handleCursorUpdate);
  //     clearAllCursorDecorations();
  //   };
  // }, [editorInstance, currentUserId, selectedFile]);

  // ================= CURSOR RENDERING HELPERS =================
  const clearAllCursorDecorations = useCallback(() => {
    if (!editorInstance) return;

    // Remove all decorations
    Object.keys(cursorDecorationsRef.current).forEach((userId) => {
      try {
        editorInstance.deltaDecorations(
          cursorDecorationsRef.current[userId] || [],
          [],
        );
      } catch (_) {}
    });
    cursorDecorationsRef.current = {};

    // Remove all label widgets
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

      // ---- 1. Cursor line decoration ----
      const decorations = [];

      // Thin vertical cursor bar
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

      // Selection highlight if user has selected text
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

      // Inject CSS for this user's color dynamically
      injectCursorStyle(userIdStr, color);

      // Apply decorations
      const prevDecorations = cursorDecorationsRef.current[userIdStr] || [];
      cursorDecorationsRef.current[userIdStr] = editorInstance.deltaDecorations(
        prevDecorations,
        decorations,
      );

      // ---- 2. Username label widget ----
      // Remove existing widget first
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

  //

  useEffect(() => {
    if (!editorInstance || !selectedFile) return;

    const removeRemoteCursor = (userId) => {
      const userIdStr = String(userId);

      // Remove Monaco decorations
      if (cursorDecorationsRef.current[userIdStr]) {
        try {
          editorInstance.deltaDecorations(
            cursorDecorationsRef.current[userIdStr],
            [],
          );
        } catch (_) {}

        delete cursorDecorationsRef.current[userIdStr];
      }

      // Remove username widget
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
      // Ignore own cursor
      if (String(data.userId) === String(currentUserId)) return;

      // If user switched file, remove old cursor instantly
      if (String(data.fileId) !== String(selectedFile._id)) {
        removeRemoteCursor(data.userId);
        return;
      }

      // Same file -> render cursor
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

  //

  // Inject per-user cursor CSS once
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
        "http://localhost:3000/vercodex/commit",
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
        "http://localhost:3000/vercodex/restore-version",
        {
          nodeId: selectedFile._id,
          commitNumber: restoreCommitNo,
        },
        { withCredentials: true },
      );

      const ytext = ydocRef.current?.getText(selectedFile._id);
      // FIX: was doing delete+insert twice — do it once
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
        `http://localhost:3000/vercodex/get/room/structure/${roomId}`,
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
        "http://localhost:3000/vercodex/create/file",
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
        "http://localhost:3000/vercodex/create/folder",
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
        "http://localhost:3000/vercodex/rename/node",
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
        `http://localhost:3000/vercodex/node/delete/${nodeId}`,
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
        "http://localhost:3000/vercodex/save/content",
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
      navigator.sendBeacon("http://localhost:3000/vercodex/save/content", blob);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [selectedFile]);

  // ================= COMMIT HISTORY =================
  const getCommitHistory = async (nodeId) => {
    try {
      const response = await axios.get(
        `http://localhost:3000/vercodex/commit/history?nodeId=${nodeId}`,
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
        "http://localhost:3000/vercodex/run/code",
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
      <div className="h-12 border-b border-gray-700 flex items-center px-4 relative">
        <div className="flex-1 flex items-center gap-3">
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
        </div>

        <div className="flex items-center gap-2 relative">
          <button
            onClick={() => {
              setShowCommitBox((prev) => !prev);
              setShowRestoreBox(false);
            }}
            className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded"
          >
            Commit
          </button>

          <button
            onClick={() => {
              setShowRestoreBox((prev) => !prev);
              setShowCommitBox(false);
            }}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded"
          >
            Restore
          </button>

          {showCommitBox && (
            <div className="absolute top-12 right-4 bg-[#1e1e1e] border border-gray-600 p-3 rounded w-64 z-50">
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
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Committing...
                  </span>
                ) : (
                  "Commit"
                )}
              </button>
            </div>
          )}

          {showRestoreBox && (
            <div className="absolute top-12 right-4 bg-[#1e1e1e] border border-gray-600 p-3 rounded w-64 z-50">
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
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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
                key={selectedFile._id}
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
