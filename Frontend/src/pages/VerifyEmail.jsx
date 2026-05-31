import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { useEffect, useState } from "react";

const VerifyEmail = () => {
  const { verificationToken } = useParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let timer;

    const verifyEmail = async () => {
      try {
        const res = await axios.get(
          `https://real-time-code-editor-vercodex.onrender.com/vercodex/verify/${verificationToken}`,
          {
            timeout: 20000,
          },
        );

        console.log(res.data.data);

        if (res.data?.data?.isEmailVerified) {
          setStatus("success");

          timer = setTimeout(() => {
            navigate("/login");
          }, 1500);
        } else {
          setStatus("failed");

          timer = setTimeout(() => {
            navigate("/resend-verification");
          }, 2000);
        }
      } catch (err) {
        console.error(err);
        setStatus("failed");

        timer = setTimeout(() => {
          navigate("/resend-verification");
        }, 2000);
      }
    };

    verifyEmail();

    return () => clearTimeout(timer);
  }, [verificationToken, navigate]);

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
              Redirecting to resend verification...
            </p>

            <button
              onClick={() => navigate("/resend-verification")}
              className="mt-6 px-5 py-2 rounded-lg bg-red-500 hover:bg-red-600 transition"
            >
              Resend Email Now
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
