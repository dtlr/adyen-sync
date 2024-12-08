import type { LocationLocal } from 'types'
import { localLocationSchema } from 'types'
import { APP_ENVS, JDNAProperty } from '@/constants.js'
import { AdyenSyncError } from '@/error'
import { logger } from '@/core/utils'

export const getLocations = async (
  requestId: string,
  store_env: (typeof APP_ENVS)[number],
  property?: (typeof JDNAProperty)[number],
) => {
  const { LOCATIONSAPI_URL, LOCATIONSAPI_CLIENT_ID, LOCATIONSAPI_CLIENT_SECRET } = process.env

  logger('get-locations').debug({
    requestId,
    message: `Getting locations for fascia: ${property}`,
    extraInfo: {
      function: 'getLocations',
      property,
      store_env,
    },
  })

  if (!LOCATIONSAPI_URL || !LOCATIONSAPI_CLIENT_ID || !LOCATIONSAPI_CLIENT_SECRET) {
    throw new AdyenSyncError({
      name: 'ENV_ERROR',
      message:
        'LOCATIONSAPI_URL, LOCATIONSAPI_CLIENT_ID, and LOCATIONSAPI_CLIENT_SECRET must be set',
      cause: {
        function: 'getLocations',
      },
    })
  }

  const locationsMap = new Map()
  const locations: LocationLocal[] = []
  let locs_filtered: LocationLocal[] = []
  let locResponse

  const locApiUri = `https://${LOCATIONSAPI_URL}`

  if (property && property === 'spc') {
    locResponse = await fetch(`${locApiUri}/ShoePalace`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'CF-Access-Client-Id': LOCATIONSAPI_CLIENT_ID,
        'CF-Access-Client-Secret': LOCATIONSAPI_CLIENT_SECRET,
      },
    })
  } else {
    locResponse = await fetch(locApiUri, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'CF-Access-Client-Id': LOCATIONSAPI_CLIENT_ID,
        'CF-Access-Client-Secret': LOCATIONSAPI_CLIENT_SECRET,
      },
    })
  }
  const data = (await locResponse.json()) as unknown as Array<unknown>

  logger('get-locations').debug({
    requestId,
    message: `Got ${data.length} locations`,
    extraInfo: {
      function: 'getLocations',
      property,
      store_env,
      data,
    },
  })

  for (const loc of data) {
    const tmpLoc = localLocationSchema.safeParse(loc)
    if (!tmpLoc.success) {
      logger('get-locations').error({
        requestId,
        message: tmpLoc.error.message,
        cause: {
          errors: tmpLoc.error.errors,
        },
        extraInfo: {
          function: 'getLocations',
          property,
          store_env,
          loc,
        },
      })
    } else {
      locations.push(tmpLoc.data)
    }
  }

  switch (property) {
    case 'spc': {
      const closedLocs = [
        '1013',
        '1067',
        '1069',
        '1203',
        '1211',
        '1252',
        '1254',
        '9993',
        '9995',
        '9998',
      ]
      const otherLocs = ['6000', '6001', '7001', '7777', '8001', '8002', '8888']
      locs_filtered =
        store_env && store_env.toLowerCase() === 'live'
          ? locations.filter(
              (item) =>
                !closedLocs.includes(item.location_code) &&
                !otherLocs.includes(item.location_code) &&
                !['9740', '9741', '9750', '9751', '9736', '9737', '9738', '9739'].includes(
                  item.location_code,
                ),
            )
          : locations.filter((item) =>
              ['9740', '9741', '9750', '9751', '9736', '9737', '9738', '9739'].includes(
                item.location_code,
              ),
            )
      break
    }
    default: {
      locs_filtered =
        store_env && store_env.toLowerCase() === 'live'
          ? locations.filter(
              (item) =>
                item.region !== 'Distribution Center' &&
                item.region !== 'E-Commerce' &&
                item.location_name !== 'SA REQUIRED' &&
                item.location_name !== 'DO NOT USE' &&
                item.location_name !== 'Promo Use Only' &&
                !['0780', '0800', '0810', '0820', '0830', '0840', '0850'].includes(
                  item.location_code,
                ),
            )
          : locations.filter((item) =>
              ['0780', '0800', '0810', '0820', '0830', '0840', '0850'].includes(item.location_code),
            )
    }
  }

  locs_filtered.map((obj) => {
    const { channel, location_code, ...rest } = obj
    switch (channel) {
      case 'DTLR': {
        locationsMap.set('DTLR' + location_code, rest)
        break
      }
      case 'Shoe Palace': {
        locationsMap.set('SPC' + location_code, rest)
      }
    }
  })

  logger('get-locations').debug({
    requestId,
    message: `Got ${locationsMap.size} locations`,
    extraInfo: {
      function: 'getLocations',
      property,
      store_env,
      data: Array.from(locationsMap.entries()),
    },
  })

  return locationsMap as Map<string, Omit<LocationLocal, 'location_code' | 'channel'>>
}
