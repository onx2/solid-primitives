import { Accessor, createMemo, createSignal, mapArray } from "solid-js";
import { MaybeAccessor, asAccessor } from "@solid-primitives/utils";

function getShortestColumn(heights: number[]): number {
  let min = 0;
  for (let i = 0, record = Infinity; i < heights.length; i++)
    if (heights[i]! < record) record = heights[(min = i)]!;
  return min;
}

const getNColumns = (n: number): any[] => Array.from({ length: n }, () => []);

function memoIfReactive<T, U>(source: Accessor<T> | T, fn: (v: T) => U): Accessor<U> {
  if (typeof source === "function") return createMemo(() => fn((source as any)()));
  const v = fn(source);
  return () => v;
}

const $SET_ITEM = Symbol("set-item");

const noopIndex = () => 0;

export type MasonryItemData<T> = {
  /**
   * Reference to the source item.
   */
  source: T;
  /**
   * The calculated flex order of the item.
   */
  order: Accessor<number>;
  /**
   * Calculated margin-bottom size to prevent the next item from switching columns.
   */
  margin: Accessor<number>;
  /**
   * Height of the item provided by {@link MasonryOptions.mapHeight}.
   */
  height: Accessor<number>;
  /**
   * The column the item falls into. The first column is 0.
   */
  column: Accessor<number>;
};

/**
 * The options for the masonry {@link createMasonry}
 */
export type MasonryOptions<TSource, TElement> = {
  /**
   * The source array of items to be mapped.
   * When updating the array, the masonry will be recalculated.
   * The items are compared by reference.
   */
  source: Accessor<readonly TSource[] | false | null | undefined>;
  /**
   * A function that maps the source item to a height.
   * This function is not reactive, it will be called only once for each item.
   * To provede a reactice height, return an accessor.
   */
  mapHeight: (item: TSource) => MaybeAccessor<number>;
  /**
   * A function that maps the source item to an element to render.
   * This function is not reactive, it will be called only once for each item.
   */
  mapElement: (data: MasonryItemData<TSource>, index: Accessor<number>) => TElement;
  /**
   * The number of columns to split the items into.
   * This can be an accessor to provide a reactive number of columns.
   */
  columns: MaybeAccessor<number>;
};

/**
 * The options for the masonry {@link createMasonry} without the {@link MasonryOptions.mapElement} parameter.
 */
export type MasonryOptionsNoElements<TSource> = Omit<MasonryOptions<TSource, any>, "mapElement"> & {
  mapElement?: undefined;
};

const mapData = <TSource, TElement>(
  source: TSource,
  track: VoidFunction,
  mapHeight: (item: TSource) => MaybeAccessor<number>,
  mapElement: MasonryOptions<TSource, TElement>["mapElement"] | undefined,
  index: Accessor<number>,
) => {
  let orderValue = 0,
    marginValue = 0,
    columnValue = 0;

  const data = {
    source,
    order: () => (track(), orderValue),
    margin: () => (track(), marginValue),
    column: () => (track(), columnValue),
    height: asAccessor(mapHeight(source)),
  } as MasonryItemData<TSource> & {
    [$SET_ITEM]: (col: number, order: number, margin: number) => void;
    element?: any;
  };

  if (mapElement) data.element = mapElement(data, index);

  data[$SET_ITEM] = (col, order, margin) => {
    columnValue = col;
    orderValue = order;
    marginValue = margin;
  };

  return data;
};

/**
 * Creates a masonry layout calculation from a reactive source array.
 *
 * It splits the items into columns and calculates the order based on the height of each item.
 *
 * The masonary is expected to be rendreded in a flex container with `flex-direction: column`, `flex-wrap: wrap` and limited height
 * to force the items to wrap.
 *
 * @param options The options for the masonry {@link MasonryOptions}
 *
 * @returns An array accessor of {@link MasonryItemData} or elements returned by {@link MasonryOptions.mapElement} function with the calculated container height.
 * ```ts
 * // if mapElement is not provided
 * Accessor<MasonryItemData<TSource>[]> & { height: Accessor<number> }
 * // if mapElement is provided
 * Accessor<TElement[]> & { height: Accessor<number> }
 * ```
 *
 * @example
 * ```tsx
 * const [source, setSource] = createSignal([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
 *
 * const masonry = createMasonry({
 *   source,
 *   mapHeight: i => i * 100,
 *   columns: 3,
 *   mapElement: (data, index) => <div style={{
 *     height: `${data.source * 100}px`,
 *     order: data.order(),
 *     "margin-bottom": `${data.margin()}px`,
 *   }}>
 *     Item {index()}
 *   </div>,
 * })
 *
 * <div style={{
 *   display: "flex",
 *   "flex-direction": "column",
 *   "flex-wrap": "wrap",
 *   height: masonry.height()
 * }}>
 *   {masonry()}
 * </div>
 * ```
 */

export function createMasonry<TSource, TElement>(
  options: MasonryOptions<TSource, TElement>,
): Accessor<TElement[]> & { height: Accessor<number> };

export function createMasonry<TSource>(
  options: MasonryOptionsNoElements<TSource>,
): Accessor<MasonryItemData<TSource>[]> & { height: Accessor<number> };

export function createMasonry<T>(
  options: MasonryOptionsNoElements<T> | MasonryOptions<T, any>,
): Accessor<any[]> & { height: Accessor<number> } {
  const { source, mapHeight, mapElement, columns } = options,
    [memo, setMemo] = createSignal<VoidFunction>(),
    mapped = createMemo(
      mapArray(
        source,
        mapElement && mapElement.length > 1
          ? (source, index) => mapData(source, () => memo()?.(), mapHeight, mapElement, index)
          : source => mapData(source, () => memo()?.(), mapHeight, mapElement, noopIndex),
      ),
    ),
    getColumns: Accessor<ReturnType<typeof mapped>[]> = memoIfReactive(columns, getNColumns),
    height = setMemo(() =>
      createMemo(() => {
        const items = mapped(),
          columns = getColumns(),
          heights = new Array(columns.length).fill(0);

        for (let i = 0; i < items.length; i++) {
          const item = items[i]!,
            col = getShortestColumn(heights);

          columns[col]!.push(item);
          heights[col] += item.height();
        }
        const height = Math.max(...heights);

        for (let colIndex = 0, order = 0; colIndex < columns.length; colIndex++) {
          const col = columns[colIndex]!;
          for (let i = 0; i < col.length; i++, order++)
            col[i]![$SET_ITEM](
              colIndex,
              order,
              i === col.length - 1 ? height - heights[colIndex]! : 0,
            );
          col.length = 0;
        }

        return height;
      }),
    ),
    result = mapElement ? createMemo(() => mapped().map(i => i.element)) : mapped;

  (result as any).height = height;

  return result as any;
}
