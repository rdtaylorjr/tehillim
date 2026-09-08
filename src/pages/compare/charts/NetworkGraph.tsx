import { useEffect, useId, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import styles from "./NetworkGraph.module.css";
import { buildNetworkGraph, isEdgeDimmed, isNodeDimmed } from "../lib/network";
import type { NetworkEdge, NetworkNode } from "../lib/network";
import { percentileOffDiagonal } from "../../../shared/lib/results";
import type { ReferenceColoring } from "../../../shared/lib/color";
import type { MethodPayload } from "../../../shared/model";

interface SimNode extends NetworkNode, d3.SimulationNodeDatum {}
type SimEdge = d3.SimulationLinkDatum<SimNode>;

/** An endpoint is a psalm number until d3 resolves it into the node object. */
function endpointId(end: SimEdge["source"]): number {
  if (typeof end === "number") return end;
  if (typeof end === "string") return Number(end);
  return end.id;
}

//: A percentile of each method's score distribution, since baselines differ widely.
const DEFAULT_THRESHOLD_PERCENTILE = 98;

/** The parts of the plot that outlive a render: selections and the simulation. */
interface Plot {
  destroy: () => void;
  setThreshold: (threshold: number) => void;
  setSelected: (psalm: number | null) => void;
  setColoring: (coloring: ReferenceColoring) => void;
}

function createPlot(
  container: HTMLElement,
  data: MethodPayload,
  initialColoring: ReferenceColoring,
  onSelect: (psalm: number) => void,
  onEdgeCountChange: (count: number) => void,
): Plot {
  let coloring = initialColoring;
  container.innerHTML = "";

  const svg = d3.select(container).append("svg");
  const zoomLayer = svg.append("g");
  const edgeLayer = zoomLayer.append("g");
  const nodeLayer = zoomLayer.append("g");
  const labelLayer = zoomLayer.append("g");

  svg.call(
    d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.4, 6])
      .on("zoom", (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
        zoomLayer.attr("transform", event.transform.toString());
      }),
  );

  let nodes: SimNode[] = [];
  let neighbors = new Map<number, Set<number>>();
  let selected: number | null = null;

  const applySelectionStyles = (): void => {
    nodeLayer
      .selectAll<SVGCircleElement, SimNode>("circle")
      .classed(styles.isSelected, (d) => d.id === selected)
      .classed(styles.isDim, (d) => isNodeDimmed(d.id, selected, neighbors));

    edgeLayer.selectAll<SVGLineElement, SimEdge>("line").classed(styles.isDim, (d) => {
      const source = d.source as SimNode | number;
      const target = d.target as SimNode | number;
      const s = typeof source === "number" ? source : source.id;
      const t = typeof target === "number" ? target : target.id;
      return isEdgeDimmed(s, t, selected, neighbors);
    });
  };

  const simulation = d3
    .forceSimulation<SimNode>()
    .force("charge", d3.forceManyBody().strength(-30))
    .force("collide", d3.forceCollide<SimNode>(6))
    .force("x", d3.forceX<SimNode>().strength(0.05))
    .force("y", d3.forceY<SimNode>().strength(0.05))
    .on("tick", () => {
      nodeLayer
        .selectAll<SVGCircleElement, SimNode>("circle")
        .attr("cx", (d) => d.x ?? 0)
        .attr("cy", (d) => d.y ?? 0);
      labelLayer
        .selectAll<SVGTextElement, SimNode>("text")
        .attr("x", (d) => d.x ?? 0)
        .attr("y", (d) => (d.y ?? 0) - 8);
      edgeLayer
        .selectAll<SVGLineElement, SimEdge>("line")
        .attr("x1", (d) => (d.source as SimNode).x ?? 0)
        .attr("y1", (d) => (d.source as SimNode).y ?? 0)
        .attr("x2", (d) => (d.target as SimNode).x ?? 0)
        .attr("y2", (d) => (d.target as SimNode).y ?? 0);
    });

  const dragBehavior = (): d3.DragBehavior<
    SVGCircleElement,
    SimNode,
    SimNode | d3.SubjectPosition
  > =>
    d3
      .drag<SVGCircleElement, SimNode>()
      .on("start", (event: d3.D3DragEvent<SVGCircleElement, SimNode, SimNode>) => {
        if (!event.active) simulation.alphaTarget(0.2).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      })
      .on("drag", (event: d3.D3DragEvent<SVGCircleElement, SimNode, SimNode>) => {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      })
      .on("end", (event: d3.D3DragEvent<SVGCircleElement, SimNode, SimNode>) => {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      });

  const center = (): void => {
    const rect = container.getBoundingClientRect();
    svg.attr("viewBox", [-rect.width / 2, -rect.height / 2, rect.width, rect.height].join(" "));
  };

  const render = (graphNodes: NetworkNode[], edges: NetworkEdge[]): void => {
    center();

    const existingById = new Map(nodes.map((n) => [n.id, n]));
    nodes = graphNodes.map((n) => ({ ...existingById.get(n.id), ...n }));

    neighbors = new Map(nodes.map((n) => [n.id, new Set<number>()]));
    const simEdges: SimEdge[] = edges.map((e) => ({ source: e.source, target: e.target }));
    for (const e of edges) {
      neighbors.get(e.source)?.add(e.target);
      neighbors.get(e.target)?.add(e.source);
    }

    //: Fixed style, so thickness never doubles as a second similarity scale.
    edgeLayer
      .selectAll<SVGLineElement, SimEdge>("line")
      .data(simEdges, (d) => `${String(endpointId(d.source))}-${String(endpointId(d.target))}`)
      .join("line")
      .attr("class", styles.networkEdge);

    const nodeSelection = nodeLayer
      .selectAll<SVGCircleElement, SimNode>("circle")
      .data(nodes, (d) => d.id)
      .join((enter) =>
        enter
          .append("circle")
          .attr("class", styles.networkNode)
          .attr("r", 5)
          .on("click", (_event, d) => {
            onSelect(d.id);
          })
          .call(dragBehavior()),
      )
      .attr("fill", (d) => coloring.colorOf(d.id));
    nodeSelection.selectAll("title").remove();
    nodeSelection.append("title").text((d) => `Psalm ${String(d.id)}`);

    labelLayer
      .selectAll<SVGTextElement, SimNode>("text")
      .data(
        nodes.filter((n) => n.id % 10 === 0),
        (d) => d.id,
      )
      .join("text")
      .attr("class", styles.networkLabel)
      .text((d) => String(d.id));

    simulation.nodes(nodes);
    simulation.force(
      "link",
      d3
        .forceLink<SimNode, SimEdge>(simEdges)
        .id((d) => d.id)
        .distance(28)
        .strength(0.15),
    );
    simulation.alpha(0.6).restart();

    applySelectionStyles();
  };

  const resizeObserver = new ResizeObserver(center);
  resizeObserver.observe(container);

  return {
    destroy(): void {
      resizeObserver.disconnect();
      simulation.stop();
      container.innerHTML = "";
    },
    setThreshold(threshold: number): void {
      const graph = buildNetworkGraph(data, threshold);
      onEdgeCountChange(graph.edges.length);
      render(graph.nodes, graph.edges);
    },
    setSelected(psalm: number | null): void {
      selected = psalm;
      applySelectionStyles();
    },
    /** Recolors nodes in place, so the force layout keeps its positions. */
    setColoring(next: ReferenceColoring): void {
      coloring = next;
      nodeLayer
        .selectAll<SVGCircleElement, SimNode>("circle")
        .attr("fill", (d) => coloring.colorOf(d.id));
    },
  };
}

export interface NetworkGraphProps {
  readonly method: MethodPayload;
  readonly coloring: ReferenceColoring;
  readonly selected: number | null;
  readonly onSelect: (psalm: number) => void;
}

/** Force-directed network of psalms, filled by the shared reference coloring. */
export function NetworkGraph({
  method,
  coloring,
  selected,
  onSelect,
}: NetworkGraphProps): React.ReactElement {
  const sliderId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const plotRef = useRef<Plot | null>(null);
  const onSelectRef = useRef(onSelect);
  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  const defaultThreshold = useMemo(
    () => percentileOffDiagonal(method.matrix, DEFAULT_THRESHOLD_PERCENTILE),
    [method],
  );
  const [threshold, setThreshold] = useState(defaultThreshold);
  const [edgeCount, setEdgeCount] = useState(0);
  //: Adjusted during render, so the slider never paints the previous method's value.
  const [appliedDefault, setAppliedDefault] = useState(defaultThreshold);
  if (appliedDefault !== defaultThreshold) {
    setAppliedDefault(defaultThreshold);
    setThreshold(defaultThreshold);
  }

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;
    const plot = createPlot(
      container,
      method,
      coloring,
      (psalm) => {
        onSelectRef.current(psalm);
      },
      setEdgeCount,
    );
    plotRef.current = plot;
    return () => {
      plot.destroy();
      plotRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- setColoring applies it
  }, [method]);

  useEffect(() => {
    plotRef.current?.setThreshold(threshold);
  }, [threshold]);

  useEffect(() => {
    plotRef.current?.setColoring(coloring);
  }, [coloring]);

  useEffect(() => {
    plotRef.current?.setSelected(selected);
  }, [selected]);

  return (
    <>
      <div className={styles.networkControls}>
        <label htmlFor={sliderId}>Similarity threshold</label>
        <input
          id={sliderId}
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={threshold}
          onChange={(event) => {
            setThreshold(Number(event.target.value));
          }}
        />
        <output className={styles.thresholdValue} htmlFor={sliderId}>
          {threshold.toFixed(2)}
        </output>
        <span className={styles.edgeCount}>{edgeCount.toLocaleString()} connections shown</span>
      </div>
      <div className={styles.networkContainer} ref={containerRef} />
    </>
  );
}
