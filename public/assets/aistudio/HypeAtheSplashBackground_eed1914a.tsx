import "./HypeAtheSplashBackground.css";

type Props = { children?: React.ReactNode };

/* Wrap your EXISTING splash/loading content with this component. */
export default function HypeAtheSplashBackground({ children }: Props) {
  return <main className="hypeathe-splash">{children}</main>;
}
