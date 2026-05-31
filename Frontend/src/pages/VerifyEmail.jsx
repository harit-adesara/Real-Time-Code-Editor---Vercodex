import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { useEffect } from "react";

const VerifyEmail = () => {
  const { verificationToken } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const verify = async () => {
      try {
        const res = await axios.get(
          `https://real-time-code-editor-vercodex.onrender.com/vercodex/verify/${verificationToken}`,
        );

        if (res.data.success) {
          setTimeout(() => {
            navigate("/login");
          }, 1500);
        }
      } catch (err) {}
    };

    verify();
  }, [verificationToken]);

  return (
    <div>
      <h2>Verifying your email...</h2>
    </div>
  );
};

export default VerifyEmail;
