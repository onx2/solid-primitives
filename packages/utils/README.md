# @solid-primitives/utils

Solid Primitives Utilities is a support and helper package for a number of primitives in our library. Please free to augment or centralize useful utilities and methods in this package for sharing.

## Installation

```bash
npm install @solid-primitives/utils
# or
yarn add @solid-primitives/utils
```

## Package Entries

- [`*` - `@solid-primitives/utils`](https://github.com/davedbase/solid-primitives/blob/main/packages/utils/src/index.ts) - General utilities.
- [`/fp` - `@solid-primitives/utils/fp`](https://github.com/davedbase/solid-primitives/blob/main/packages/utils/src/fp.ts) - Helpers for making changes to immutable data.
- [`/setter` - `@solid-primitives/utils/setter`](https://github.com/davedbase/solid-primitives/blob/main/packages/utils/src/setter.ts) - Modified helpers from the `/fp`, but optimized for usage with signal setters.

Import accordingly.

```ts
import { access, promiseTimeout } from "@solid-primitives/utils";

// between these two some function names will overlap.
import { pick, omit, filter } from "@solid-primitives/utils/fp";
import { push, filter, drop } from "@solid-primitives/utils/setter";
```

## Changelog

<details>
<summary><b>Expand Changelog</b></summary>

0.0.100

First commit of the timer primitive.

0.0.250

Republished version with better ESM support and build tooling.

0.0.260

Added comments for util methods.

0.1.0

Add `/fp` and `/setter` export entries. Add `destore` and `raceTimeout` util. More jsdoc.

</details>