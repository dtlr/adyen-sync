import sodium from 'libsodium-wrappers'

/**
 * Encrypt a secret value
 * @param {string} publicKey - The public key
 * @param {string} secretValue - The secret value
 * @returns {string} - The encrypted secret value
 */
export const encryptSecret = async (publicKey, secretValue) => {
  await sodium.ready
  const publicKeyBinary = sodium.from_base64(publicKey, sodium.base64_variants.ORIGINAL)
  const secretValueBinary = sodium.from_string(secretValue)
  const encryptedBinary = sodium.crypto_box_seal(secretValueBinary, publicKeyBinary)
  return sodium.to_base64(encryptedBinary, sodium.base64_variants.ORIGINAL)
}

/**
 * Parse a PostgreSQL connection URI
 * @param {string} url - The connection URI
 * @returns {Object} - The parsed connection details
 * @returns {string} returns.username - Database username
 * @returns {string} returns.password - Database password
 * @returns {string} returns.host - Database host
 * @returns {number} returns.port - Database port number
 * @returns {string} returns.database - Database name
 * @returns {Object} returns.params - Additional connection parameters as key-value pairs
 */
export const parseConnectionUri = (url) => {
  // Regex pattern with named capture groups
  const pattern =
    /^postgres(?:ql)?:\/\/(?:(?<username>[^:@]+)(?::(?<password>[^@]+))?@)?(?<host>[^:/?#]+)(?::(?<port>\d+))?\/(?<database>[^?]+)(?:\?(?<params>.*))?$/

  const match = url.match(pattern)

  if (!match) {
    throw new Error('Invalid PostgreSQL connection string')
  }

  const { username, password, host, port, database, params } = match.groups

  return {
    username: username || '',
    password: password || '',
    host: host || 'localhost',
    port: port ? parseInt(port) : 5432,
    database: database || '',
    params: params ? Object.fromEntries(new URLSearchParams(params)) : {},
  }
}
