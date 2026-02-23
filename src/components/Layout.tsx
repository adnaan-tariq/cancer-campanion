import { ReactNode } from "react";
import Navbar from "./Navbar";
import DisclaimerBanner from "./DisclaimerBanner";
import EmergencyContactBanner from "./EmergencyContactBanner";
import Footer from "./Footer";
import ModelStatusBadge from "./ModelStatusBadge";

const Layout = ({ children }: { children: ReactNode }) => (
  <div className="flex min-h-screen flex-col">
    <ModelStatusBadge />
    <Navbar />
    <EmergencyContactBanner />
    <main className="flex-1">{children}</main>
    <DisclaimerBanner />
    <Footer />
  </div>
);

export default Layout;
