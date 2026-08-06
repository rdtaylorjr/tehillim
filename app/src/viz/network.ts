import * as d3 from "d3";
import type { ReferenceColoring } from "../lib/referenceColor";
import { buildNetworkGraph, isEdgeDimmed, isNodeDimmed, type NetworkEdge, type NetworkNode } from "../lib/network";
import type { MethodPayload } from "../types";

interface SimNode extends NetworkNode, d3.SimulationNodeDatum {}
type SimEdge = d3.SimulationLinkDatum<SimNode>;

export interface NetworkOptions {
  container: HTMLElement;
  data: MethodPayload;
  coloring: ReferenceColoring;
  onSelect: (psalm: number) => void;
  onEdgeCountChange?: (count: number) => void;
}

/** Force-directed similarity network: nodes are psalms, edges are pairs above a threshold.
 * Node fill always follows the shared reference coloring (Book / Gunkel family / Gunkel
 * genre) - see setColoring() for switching it without restarting the force layout. */
export class NetworkGraph {
  private readonly options: NetworkOptions;
  private coloring: ReferenceColoring;

  private readonly svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private readonly edgeLayer: d3.Selection<SVGGElement, unknown, null, undefined>;
  private readonly nodeLayer: d3.Selection<SVGGElement, unknown, null, undefined>;
  private readonly labelLayer: d3.Selection<SVGGElement, unknown, null, undefined>;

  private readonly simulation: d3.Simulation<SimNode, SimEdge>;
  private nodes: SimNode[] = [];
  private neighbors = new Map<number, Set<number>>();
  private selected: number | null = null;
  private readonly resizeObserver: ResizeObserver;

  constructor(options: NetworkOptions) {
    this.options = options;
    this.coloring = options.coloring;
    options.container.innerHTML = "";

    this.svg = d3.select(options.container).append("svg");
    const zoomLayer = this.svg.append("g");
    this.edgeLayer = zoomLayer.append("g").attr("class", "edge-layer");
    this.nodeLayer = zoomLayer.append("g").attr("class", "node-layer");
    this.labelLayer = zoomLayer.append("g").attr("class", "label-layer");

    this.svg.call(
      d3
        .zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.4, 6])
        .on("zoom", (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
          zoomLayer.attr("transform", event.transform.toString());
        }),
    );

    this.simulation = d3
      .forceSimulation<SimNode>()
      .force("charge", d3.forceManyBody().strength(-30))
      .force("collide", d3.forceCollide<SimNode>(6))
      .force("x", d3.forceX<SimNode>().strength(0.05))
      .force("y", d3.forceY<SimNode>().strength(0.05))
      .on("tick", () => this.onTick());

    this.resizeObserver = new ResizeObserver(() => this.center());
    this.resizeObserver.observe(options.container);

    this.setThreshold(0.3);
  }

  setThreshold(threshold: number): void {
    const graph = buildNetworkGraph(this.options.data, threshold);
    this.options.onEdgeCountChange?.(graph.edges.length);
    this.render(graph.nodes, graph.edges);
  }

  setSelected(psalm: number | null): void {
    this.selected = psalm;
    this.applySelectionStyles();
  }

  /** Swaps the reference coloring and recolors existing nodes in place -
   * deliberately not a remount, so the force layout keeps its current
   * positions instead of jumping and restarting just to change colors. */
  setColoring(coloring: ReferenceColoring): void {
    this.coloring = coloring;
    this.nodeLayer
      .selectAll<SVGCircleElement, SimNode>("circle")
      .attr("fill", (d) => this.coloring.colorOf(d.id));
  }

  destroy(): void {
    this.resizeObserver.disconnect();
    this.simulation.stop();
  }

  private center(): void {
    const rect = this.options.container.getBoundingClientRect();
    this.svg.attr("viewBox", [-rect.width / 2, -rect.height / 2, rect.width, rect.height]);
  }

  private render(nodes: NetworkNode[], edges: NetworkEdge[]): void {
    this.center();

    const existingById = new Map(this.nodes.map((n) => [n.id, n]));
    this.nodes = nodes.map((n) => ({ ...existingById.get(n.id), ...n }));

    this.neighbors = new Map(this.nodes.map((n) => [n.id, new Set<number>()]));
    const simEdges: SimEdge[] = edges.map((e) => ({
      source: e.source,
      target: e.target,
    }));
    for (const e of edges) {
      this.neighbors.get(e.source)?.add(e.target);
      this.neighbors.get(e.target)?.add(e.source);
    }

    // Fixed style, not scaled by weight - a plain, consistent line for
    // every edge (see .network-edge in style.css) rather than doubling
    // as a second, thickness-encoded similarity scale.
    this.edgeLayer
      .selectAll<SVGLineElement, SimEdge>("line")
      .data(simEdges, (d) => `${(d.source as SimNode | number).valueOf()}-${(d.target as SimNode | number).valueOf()}`)
      .join("line")
      .attr("class", "network-edge");

    const nodeSelection = this.nodeLayer
      .selectAll<SVGCircleElement, SimNode>("circle")
      .data(this.nodes, (d) => d.id)
      .join(
        (enter) =>
          enter
            .append("circle")
            .attr("class", "network-node")
            .attr("r", 5)
            .on("click", (_event, d) => this.options.onSelect(d.id))
            .call(this.dragBehavior()),
        (update) => update,
      )
      .attr("fill", (d) => this.coloring.colorOf(d.id));
    nodeSelection.append("title").text((d) => `Psalm ${d.id}`);

    this.labelLayer
      .selectAll<SVGTextElement, SimNode>("text")
      .data(
        this.nodes.filter((n) => n.id % 10 === 0),
        (d) => d.id,
      )
      .join("text")
      .attr("class", "network-label")
      .text((d) => String(d.id));

    this.simulation.nodes(this.nodes);
    this.simulation.force(
      "link",
      d3
        .forceLink<SimNode, SimEdge>(simEdges)
        .id((d) => d.id)
        .distance(28)
        .strength(0.15),
    );
    this.simulation.alpha(0.6).restart();

    this.applySelectionStyles();
  }

  private applySelectionStyles(): void {
    const selected = this.selected;

    this.nodeLayer
      .selectAll<SVGCircleElement, SimNode>("circle")
      .classed("is-selected", (d) => d.id === selected)
      .classed("is-dim", (d) => isNodeDimmed(d.id, selected, this.neighbors));

    this.edgeLayer.selectAll<SVGLineElement, SimEdge>("line").classed("is-dim", (d) => {
      const s = (d.source as SimNode).id ?? (d.source as number);
      const t = (d.target as SimNode).id ?? (d.target as number);
      return isEdgeDimmed(s, t, selected, this.neighbors);
    });
  }

  private onTick(): void {
    this.nodeLayer
      .selectAll<SVGCircleElement, SimNode>("circle")
      .attr("cx", (d) => d.x ?? 0)
      .attr("cy", (d) => d.y ?? 0);

    this.labelLayer
      .selectAll<SVGTextElement, SimNode>("text")
      .attr("x", (d) => d.x ?? 0)
      .attr("y", (d) => (d.y ?? 0) - 8);

    this.edgeLayer
      .selectAll<SVGLineElement, SimEdge>("line")
      .attr("x1", (d) => (d.source as SimNode).x ?? 0)
      .attr("y1", (d) => (d.source as SimNode).y ?? 0)
      .attr("x2", (d) => (d.target as SimNode).x ?? 0)
      .attr("y2", (d) => (d.target as SimNode).y ?? 0);
  }

  private dragBehavior(): d3.DragBehavior<SVGCircleElement, SimNode, SimNode | d3.SubjectPosition> {
    return d3
      .drag<SVGCircleElement, SimNode>()
      .on("start", (event: d3.D3DragEvent<SVGCircleElement, SimNode, SimNode>) => {
        if (!event.active) this.simulation.alphaTarget(0.2).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      })
      .on("drag", (event: d3.D3DragEvent<SVGCircleElement, SimNode, SimNode>) => {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      })
      .on("end", (event: d3.D3DragEvent<SVGCircleElement, SimNode, SimNode>) => {
        if (!event.active) this.simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      });
  }
}
