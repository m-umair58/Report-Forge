/**
 * Contract for components in the Builder component tree.
 * Components describe report content without layout or format details.
 */
export interface IComponent {
  /** Discriminator for the component kind (e.g. 'title', 'table'). */
  readonly type: string;

  /** Unique identifier within the report. */
  readonly id: string;

  /** Component-specific properties. */
  readonly props: Readonly<Record<string, unknown>>;

  /** Child components nested within this component. */
  readonly children: readonly IComponent[];
}
