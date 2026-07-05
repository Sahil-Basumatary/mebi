/* eslint-disable @typescript-eslint/no-explicit-any */

declare module "d3-force-3d" {
  export interface ForceSimulation {
    alpha(value: number): ForceSimulation;
    alphaTarget(value: number): ForceSimulation;
    alphaDecay(value: number): ForceSimulation;
    velocityDecay(value: number): ForceSimulation;
    force(name: string, force: any): ForceSimulation;
    stop(): ForceSimulation;
    tick(iterations?: number): ForceSimulation;
  }
  export function forceSimulation(nodes?: any[], numDimensions?: number): ForceSimulation;
  export function forceLink(links?: any[]): any;
  export function forceManyBody(): any;
  export function forceCenter(x?: number, y?: number, z?: number): any;
  export function forceRadial(radius: number, x?: number, y?: number, z?: number): any;
}
