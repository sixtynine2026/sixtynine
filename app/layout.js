import './globals.css';
import Shell from '../components/Shell';
export const metadata = { title: 'SIXTYNINE PROJECT', description: 'Streetwear Bandung' };
export default function RootLayout({ children }) {
  return <html lang="id"><body><Shell>{children}</Shell></body></html>;
}
