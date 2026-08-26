import styles from "./Footer.module.css";
import { AUTHOR, LINKS, RELEASE_YEAR, VERSION } from "../../../shared/lib/attribution";

/** Every outbound link leaves the app, so each opens in a new tab with the opener severed. */
const EXTERNAL = { target: "_blank", rel: "noopener noreferrer" } as const;

/** One line: build detail on the left, the data this rests on to the right. */
export function Footer(): React.ReactElement {
  return (
    <footer className={styles.siteFooter}>
      <span>
        v{VERSION} &middot; {RELEASE_YEAR} &middot;{" "}
        <a href={AUTHOR.url} {...EXTERNAL}>
          github.com/rdtaylorjr
        </a>
      </span>
      <span>
        <a href={LINKS.bhsa} {...EXTERNAL}>
          BHSA
        </a>{" "}
        &middot;{" "}
        <a href={LINKS.textFabric} {...EXTERNAL}>
          Text-Fabric
        </a>{" "}
        &middot;{" "}
        <a href={LINKS.psalmsExplorer} {...EXTERNAL}>
          Logos Psalms Explorer
        </a>{" "}
        (used with permission)
      </span>
    </footer>
  );
}
