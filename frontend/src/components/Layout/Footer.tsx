import { Link } from 'react-router-dom';
import './Footer.css';
export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-left">
          <Link to="/" className="footer-logo">
            TroUyTin
          </Link>
          <p className="footer-tagline">© 2024 TroUyTin · Nền tảng thuê phòng minh bạch</p>
        </div>
        <div className="footer-links">
          <Link to="/" className="footer-link">Điều khoản</Link>
          <Link to="/" className="footer-link">Chính sách bảo mật</Link>
          <Link to="/" className="footer-link">Liên hệ</Link>
          <Link to="/" className="footer-link">Trợ giúp</Link>
        </div>
      </div>
    </footer>
  );
}
