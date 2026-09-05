# Build debugging record

## Package release tags

**Problem:** installing the local PostgreSQL wrapper with `embedded-postgres@17` failed.

**Original approach:** infer that a wrapper tracking PostgreSQL major versions publishes a matching stable npm major tag.

**Why it failed:** the wrapper publishes prerelease-tagged versions. npm does not match those through the plain major selector.

**Diagnosis:** inspect the npm dist-tags and version list, then compare the maintainer's usage documentation.

**Fix:** pin `17.10.0-beta.17` explicitly. Document the distinction between the wrapper release and the PostgreSQL binary version.

**Verification:** installation and real database checks are recorded in the verification file; the fix is not proven merely by changing a manifest.

**General lesson:** verify package APIs and publication semantics instead of inferring them from names.

## Windows process command size

**Problem:** a single tool command containing several large generated UI files failed before execution with Windows error 206.

**Original approach:** batch the entire frontend into one command.

**Why it failed:** the command exceeded the Windows process command-line limit after quoting.

**Diagnosis:** the error was a process-spawn failure; it did not report a TypeScript or application error.

**Fix:** split the UI into focused components and write bounded file batches. This also reduced the monolithic workspace component.

**Verification:** bounded writes completed; compiler and browser verification are tracked separately.

**General lesson:** tool/environment constraints are part of implementation. Smaller, independently checkable changes improve both reliability and reviewability.

## UUID normalization at a database boundary

**Problem:** PostgreSQL returns canonical lowercase UUIDs, while the input validator initially accepted uppercase UUID text unchanged.

**Original approach:** validate UUID syntax, then use the original string as a JavaScript Map key and idempotency fingerprint input.

**Why it failed:** equivalent UUID spellings could miss the quantity lookup or compare as different requests.

**Diagnosis:** review the boundary between Zod input, PostgreSQL UUID output and string-based Maps.

**Fix:** lowercase UUID inputs before lookup, duplicate detection and fingerprinting.

**Verification:** the PostgreSQL regression submits uppercase product IDs, retries with lowercase IDs, and asserts the same order. The final 22-test suite passed.

**General lesson:** syntactic validation and canonicalization solve different problems. Normalize identifiers before comparing them across systems.
