import "./Toast.css";

function Toast({ message }) {
  if (!message) return null;
  return <div className="toast" role="status">{message}</div>;
}

export default Toast;
