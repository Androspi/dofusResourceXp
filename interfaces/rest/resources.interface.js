/**
 * @typedef {Object} Rest.Resources.List
 * @property {Rest.Resources.Links} _links
 * @property {Rest.Resources.Item[]} items
 */

/**
 * @typedef {Object} Rest.Resources.Item
 * @property {number} ankama_id
 * @property {string} name
 * @property {Rest.Resources.Type} type
 * @property {number} level
 * @property {Rest.Resources.Imageurls} image_urls
 * @property {string} description
 * @property {Rest.Resources.Recipe[]} [recipe]
 * @property {Rest.Resources.Effect[]} [effects]
 */

/**
 * @typedef {Object} Rest.Resources.Effect
 * @property {number} int_minimum
 * @property {number} int_maximum
 * @property {Rest.Resources.Type} type
 * @property {boolean} ignore_int_min
 * @property {boolean} ignore_int_max
 * @property {string} formatted
 */

/**
 * @typedef {Object} Rest.Resources.Recipe
 * @property {number} item_ankama_id
 * @property {string} item_subtype
 * @property {number} quantity
 */

/**
 * @typedef {Object} Rest.Resources.Imageurls
 * @property {string} icon
 * @property {string} sd
 * @property {string} hq
 * @property {string} hd
 */

/**
 * @typedef {Object} Rest.Resources.Type
 * @property {string} name
 * @property {number} id
 * @property {boolean|undefined} is_meta
 * @property {boolean|undefined} is_active

 */

/**
 * @typedef {Object} Rest.Resources.Links
 * @property {null} first
 * @property {null} prev
 * @property {null} next
 * @property {null} last
 */
