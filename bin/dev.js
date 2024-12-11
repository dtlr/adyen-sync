#!/usr/bin/env -S node --loader ts-node/esm --disable-warning=ExperimentalWarning

;(async () => {
  const oclif = await import('@oclif/core')
  await oclif.execute({ development: true, dir: import.meta.url })
})()
