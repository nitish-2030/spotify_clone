import { Component } from "react";
import "./ErrorBoundary.css";

// Catches render errors anywhere below it so one broken component
// shows a friendly screen instead of a blank page.
class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("App crashed:", error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="crash" role="alert">
        <h1>Something went wrong</h1>
        <p>The app hit an unexpected error. Reloading usually fixes it.</p>
        <button className="crash__btn" onClick={() => window.location.reload()}>
          Reload
        </button>
      </div>
    );
  }
}

export default ErrorBoundary;
