"use client";

import { useEffect } from "react";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error("[ERP Global Error Boundary]", error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <style>{`
          *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
          body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f9fafb;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:2rem}
          .card{background:#fff;border:1px solid #e5e7eb;border-radius:1rem;padding:2.5rem;width:100%;max-width:36rem;box-shadow:0 1px 3px 0 rgb(0 0 0/.1)}
          .icon-wrap{width:5rem;height:5rem;border-radius:9999px;background:rgba(160,77,3,.1);display:flex;align-items:center;justify-content:center;margin:0 auto 1.5rem}
          h1{font-size:1.5rem;font-weight:700;color:#111827;text-align:center;margin-bottom:.5rem}
          p{font-size:.875rem;color:#6b7280;text-align:center;line-height:1.6;margin-bottom:2rem}
          .error-box{background:#fef2f2;border:1px solid #fee2e2;border-radius:.5rem;padding:.75rem 1rem;margin-bottom:2rem;word-break:break-word}
          .error-box code{font-family:monospace;font-size:.75rem;color:#dc2626}
          .error-box span{display:block;font-family:monospace;font-size:.75rem;color:#f87171;margin-top:.25rem}
          .actions{display:flex;flex-direction:column;gap:.75rem}
          .btn-primary{display:inline-flex;align-items:center;justify-content:center;gap:.5rem;padding:.625rem 1.25rem;background:#a04d03;color:#fff;font-size:.875rem;font-weight:500;border:none;border-radius:.5rem;cursor:pointer;transition:background .15s}
          .btn-primary:hover{background:rgba(160,77,3,.9)}
          .btn-secondary{display:inline-flex;align-items:center;justify-content:center;gap:.5rem;padding:.625rem 1.25rem;background:#fff;color:#374151;font-size:.875rem;font-weight:500;border:1px solid #e5e7eb;border-radius:.5rem;cursor:pointer;transition:background .15s}
          .btn-secondary:hover{background:#f9fafb}
          @media(min-width:480px){.actions{flex-direction:row}}
          .actions .btn-primary,.actions .btn-secondary{flex:1}
        `}</style>

        <div className="card">
          <div className="icon-wrap">
            <svg width="40" height="40" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="#a04d03">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
          </div>

          <h1>Something went wrong</h1>
          <p>
            A critical error occurred and the application could not recover.
            Please try refreshing the page or return to the dashboard.
          </p>

          {error.message && (
            <div className="error-box">
              <code>{error.message}</code>
              {error.digest && <span>Error ID: {error.digest}</span>}
            </div>
          )}

          <div className="actions">
            <button className="btn-primary" onClick={reset}>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
              Try again
            </button>
            <button className="btn-secondary" onClick={() => (window.location.href = "/u/dashboard")}>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
              Back to Dashboard
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
