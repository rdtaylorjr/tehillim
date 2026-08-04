import * as d3 from "d3";
import { createBookColorScale } from "../lib/colorScale";
import { bookOfPsalm } from "../lib/books";
import { buildNetworkGraph, type NetworkEdge, type NetworkNode } from "../lib/network";
import type { MethodPayload } from "../types";

interface SimNode extends NetworkNode, d3.SimulationNodeDatum {}
interface SimEdge extends d3.SimulationLinkDatum<SimNode> {
  weight: number;
}

export interface NetworkOptions {
  container: HTMLElement;
  data: MethodPayload;
  onSelect: (psalm: number) => void;
  onEdgeCountChange?: (count: number) => void;
}

/** Force-directed similarity network: nodes are psalms, edges are pairs above a threshold. */
export class NetworkGraph {
  private readonly options: NetworkOptions;
  private readonly colorScale = createBookColorScale();

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
      weight: e.weight,
    }));
    for (const e of edges) {
      this.neighbors.get(e.source)?.add(e.target);
      this.neighbors.get(e.target)?.add(e.source);
    }

    const maxWeight = edges.reduce((max, e) => Math.max(max, e.weight), 0.01);
    const strokeWidth = d3.scaleLinear().domain([0, maxWeight]).range([0.4, 3]);
    const strokeOpacity = d3.scaleLinear().domain([0, maxWeight]).range([0.08, 0.55]);

    this.edgeLayer
      .selectAll<SVGLineElement, SimEdge>("line")
      .data(simEdges, (d) => `${(d.source as SimNode | number).valueOf()}-${(d.target as SimNode | number).valueOf()}`)
      .join("line")
      .attr("class", "network-edge")
      .attr("stroke-width", (d) => strokeWidth(d.weight))
      .attr("stroke-opacity", (d) => strokeOpacity(d.weight));

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
      .attr("fill", (d) => this.colorScale(d.book));
    nodeSelection.append("title").text((d) => `Psalm ${d.id} (${bookOfPsalm(d.id).name})`);

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
    const neighborSet = selected !== null ? this.neighbors.get(selected) : undefined;
    // Only dim the rest of the graph when the selection actually has visible
    // edges at the current threshold - otherwise dimming everything just
    // hides the graph behind one lonely dot.
    const shouldDim = selected !== null && (neighborSet?.size ?? 0) > 0;

    this.nodeLayer
      .selectAll<SVGCircleElement, SimNode>("circle")
      .classed("is-selected", (d) => d.id === selected)
      .classed("is-dim", (d) => shouldDim && d.id !== selected && !neighborSet?.has(d.id));

    this.edgeLayer
      .selectAll<SVGLineElement, SimEdge>("line")
      .classed("is-dim", (d) => {
        if (!shouldDim) return false;
        const s = (d.source as SimNode).id ?? d.source;
        const t = (d.target as SimNode).id ?? d.target;
        return s !== selected && t !== selected;
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
