import { useEffect, useState } from "react";
import styles from "./HomePage.module.css";
import { PageHeader } from "../../../widgets/layout";
import { Footer } from "../../../widgets/footer";
import { BenchmarkFigure, ClusterFigure, CompareFigure } from "./HomeFigures";
import { loadHomeFigures } from "../api/loadHomeFigures";
import type { HomeFigures } from "../api/loadHomeFigures";
import { routePath } from "../../../../shell/route";
import type { Route } from "../../../../shell/route";
import type { NavigateHandler } from "../../../../shell/Root";

interface Card {
  readonly route: Extract<Route, "benchmark" | "compare" | "cluster">;
  readonly name: string;
  /** The kind of question the page answers, set in the accent. */
  readonly what: string;
  readonly blurb: string;
  readonly figure: (props: { readonly figures: HomeFigures }) => React.ReactElement;
}

/** Measurement first, then the two views built on it. */
const CARDS: readonly Card[] = [
  {
    route: "benchmark",
    name: "Benchmark",
    what: "Model evaluation",
    blurb:
      "Evaluate each representation against three bounded questions: annotated parallelism, received genre labels, and within-psalm trajectory. Inspect effect measures, confidence intervals, multiplicity-adjusted p-values, and model-level diagnostic charts.",
    figure: BenchmarkFigure,
  },
  {
    route: "compare",
    name: "Compare",
    what: "Pairwise similarity",
    blurb:
      "Examine how a selected representation organizes all 150 Hebrew Psalms. The matrix and network present the same similarity record, while a selected psalm reveals its nearest matches, shared features, and the score that orders each match.",
    figure: CompareFigure,
  },
  {
    route: "cluster",
    name: "Cluster",
    what: "Unsupervised partitioning",
    blurb:
      "Partition the 150 Hebrew Psalms from a selected similarity representation, then compare the result with a received historical genre index. Inspect alignment and stability diagnostics, including an explicit no-structure result when the gap statistic selects one cluster.",
    figure: ClusterFigure,
  },
];

export interface HomePageProps {
  readonly navigate?: NavigateHandler;
  /** Injected in tests so the cards can be driven without a server. */
  readonly load?: () => Promise<HomeFigures>;
}

/** The front door: what this is, and what each of the three tools answers. */
export function HomePage({ navigate, load }: HomePageProps): React.ReactElement {
  //: The figures arrive rather than being drawn, so each card holds its shape.
  const [figures, setFigures] = useState<HomeFigures | null>(null);

  useEffect(() => {
    let current = true;
    void (load ?? (() => loadHomeFigures()))().then(
      (result) => {
        if (current) setFigures(result);
      },
      () => {
        //: A card without its figure is still a card, and nothing else depends on this.
      },
    );
    return () => {
      current = false;
    };
  }, [load]);

  const linkProps = (
    route: Route,
  ): { href: string; onClick?: (event: React.MouseEvent) => void } => ({
    href: routePath(route),
    ...(navigate === undefined
      ? {}
      : {
          onClick: (event: React.MouseEvent): void => {
            navigate(route, event);
          },
        }),
  });

  return (
    <>
      <PageHeader current="home" {...(navigate === undefined ? {} : { navigate })} />

      <div className={styles.home}>
        <ul className={styles.cards}>
          {CARDS.map((card) => {
            const Figure = card.figure;
            return (
              <li key={card.route}>
                <a className={styles.card} {...linkProps(card.route)}>
                  {figures === null ? (
                    <div className={styles.figurePending} aria-hidden="true" />
                  ) : (
                    <Figure figures={figures} />
                  )}
                  <h3 className={styles.cardName}>{card.name}</h3>
                  <p className={styles.cardWhat}>{card.what}</p>
                  <p className={styles.cardBlurb}>{card.blurb}</p>
                </a>
              </li>
            );
          })}
        </ul>
      </div>

      <Footer />
    </>
  );
}
