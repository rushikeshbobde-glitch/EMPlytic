import { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import "./AppLayout.css";

export default function AppLayout({ title, subtitle, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="emplytic-layout-root">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="layout-body-wrapper">
        <Header
          title={title}
          subtitle={subtitle}
          onMenuToggle={() => setSidebarOpen((prev) => !prev)}
        />
        <main className="layout-page-content">
          <div className="content-inner-container">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
