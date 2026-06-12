// import { useNavigate, useParams } from "react-router-dom";
// import axios from "axios";
// import { useEffect, useState, useRef } from "react";

// const VerifyEmail = () => {
//   const { verificationToken } = useParams();
//   const navigate = useNavigate();
//   const hasCalled = useRef(false);

//   const [status, setStatus] = useState("loading");

//   useEffect(() => {
//     let timer;

//     const verifyEmail = async () => {
//       if (hasCalled.current) return;
//       hasCalled.current = true;
//       console.log("VERIFY CALL:", verificationToken, Date.now());
//       try {
//         const res = await axios.get(
//           `https://real-time-code-editor-vercodex.onrender.com/vercodex/verify/${verificationToken}`,
//           {
//             skipAuth: true,
//           },
//         );

//         if (res.data?.data?.isEmailVerified) {
//           setStatus("success");

//           timer = setTimeout(() => {
//             navigate("/login");
//           }, 1500);
//         }
//       } catch (err) {
//         console.log("STATUS:", err.response?.status);
//         console.log("DATA:", err.response?.data);
//         console.log("URL:", err.config?.url);
//         console.log("FULL ERROR:", err);
//         setStatus("failed");

//         timer = setTimeout(() => {
//           navigate("/resend-verification");
//         }, 2000);
//       }
//     };

//     verifyEmail();

//     return () => clearTimeout(timer);
//   }, [verificationToken, navigate]);

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-gray-900 via-gray-800 to-black text-white px-4">
//       <div className="w-full max-w-md rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl p-8 text-center">
//         {/* LOADING */}
//         {status === "loading" && (
//           <>
//             <div className="mx-auto mb-6 h-14 w-14 rounded-full border-4 border-gray-500 border-t-blue-400 animate-spin"></div>

//             <h2 className="text-xl font-semibold">Verifying your email...</h2>
//             <p className="text-gray-300 mt-2 text-sm">
//               Please wait while we confirm your account
//             </p>
//           </>
//         )}

//         {/* SUCCESS */}
//         {status === "success" && (
//           <>
//             <div className="mx-auto mb-6 text-green-400 text-5xl">✓</div>

//             <h2 className="text-xl font-semibold text-green-400">
//               Email Verified!
//             </h2>

//             <p className="text-gray-300 mt-2 text-sm">
//               Redirecting you to login...
//             </p>
//           </>
//         )}

//         {/* FAILED */}
//         {status === "failed" && (
//           <>
//             <div className="mx-auto mb-6 text-red-400 text-5xl">✕</div>

//             <h2 className="text-xl font-semibold text-red-400">
//               Verification Failed
//             </h2>

//             <p className="text-gray-300 mt-2 text-sm">
//               Redirecting to resend verification...
//             </p>

//             <button
//               onClick={() => navigate("/resend-verification")}
//               className="mt-6 px-5 py-2 rounded-lg bg-red-500 hover:bg-red-600 transition"
//             >
//               Resend Email Now
//             </button>
//           </>
//         )}
//       </div>
//     </div>
//   );
// };

// export default VerifyEmail;
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { useEffect, useState, useRef } from "react";

const VerifyEmail = () => {
  const { verificationToken } = useParams();
  const navigate = useNavigate();
  const hasCalled = useRef(false);

  const [status, setStatus] = useState("loading");

  useEffect(() => {
    const verifyEmail = async () => {
      if (hasCalled.current) return;
      hasCalled.current = true;
      try {
        await axios.get(
          `https://real-time-code-editor-vercodex.onrender.com/vercodex/verify/${verificationToken}`,
          { skipAuth: true },
        );
        setStatus("success");
      } catch {
        setStatus("failed");
      }
    };

    verifyEmail();
  }, [verificationToken]);

  useEffect(() => {
    if (status === "success") {
      const timer = setTimeout(
        () => navigate("/login", { replace: true }),
        1500,
      );
      return () => clearTimeout(timer);
    }
    if (status === "failed") {
      const timer = setTimeout(
        () => navigate("/resend-verification", { replace: true }),
        2000,
      );
      return () => clearTimeout(timer);
    }
  }, [status, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-gray-900 via-gray-800 to-black text-white px-4">
      <div className="w-full max-w-md rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl p-8 text-center">
        {/* LOADING */}
        {status === "loading" && (
          <>
            <div className="mx-auto mb-6 h-14 w-14 rounded-full border-4 border-gray-500 border-t-blue-400 animate-spin"></div>

            <h2 className="text-xl font-semibold">Verifying your email...</h2>
            <p className="text-gray-300 mt-2 text-sm">
              Please wait while we confirm your account
            </p>
          </>
        )}

        {/* SUCCESS */}
        {status === "success" && (
          <>
            <div className="mx-auto mb-6 text-green-400 text-5xl">✓</div>

            <h2 className="text-xl font-semibold text-green-400">
              Email Verified!
            </h2>

            <p className="text-gray-300 mt-2 text-sm">
              Redirecting you to login...
            </p>
          </>
        )}

        {/* FAILED */}
        {status === "failed" && (
          <>
            <div className="mx-auto mb-6 text-red-400 text-5xl">✕</div>

            <h2 className="text-xl font-semibold text-red-400">
              Verification Failed
            </h2>

            <p className="text-gray-300 mt-2 text-sm">
              Redirecting to register...
            </p>

            <button
              onClick={() => navigate("/register")}
              className="mt-6 px-5 py-2 rounded-lg bg-red-500 hover:bg-red-600 transition"
            >
              Go to Register
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
