import { ReactNode } from "react";
import SellerHeader from "./SellerHeader";
import Footer from "./Footer";

interface SellerLayoutProps {
  children: ReactNode;
  showFooter?: boolean;
}

const SellerLayout = ({ children, showFooter = true }: SellerLayoutProps) => {
  return (
    <div className="min-h-screen bg-gradient-hero field-pattern flex flex-col">
      <SellerHeader />
      <main className="main-content flex-1">
        {children}
      </main>
      {showFooter && <Footer />}
    </div>
  );
};

export default SellerLayout;
