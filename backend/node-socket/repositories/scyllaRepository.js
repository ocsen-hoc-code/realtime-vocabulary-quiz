const scyllaClient = require("../config/scyllaClient");

class ScyllaDBRepository {
  constructor(client) {
    this.client = client;
  }

  /**
   * Insert a record into a table.
   * @param {string} tableName
   * @param {Object} data
   * @param {Array} columns
   */
  async insertRecord(tableName, data, columns) {
    if (!data || Object.keys(data).length === 0) {
      throw new Error("No data to insert");
    }

    const keys = columns.join(", ");
    const placeholders = columns.map(() => "?").join(", ");
    const values = columns.map((col) => data[col] ?? null);

    const query = `INSERT INTO ${tableName} (${keys}) VALUES (${placeholders})`;
    console.log("Executing query:", query, values);

    try {
      await this.client.execute(query, values, { prepare: true });
      console.log("✅ Record inserted successfully");
    } catch (error) {
      throw new Error(`Failed to insert record: ${error.message}`);
    }
  }

  /**
   * Select records from a table.
   * @param {string} tableName
   * @param {Array} columns
   * @param {Object} conditions
   */
  async selectRecords(tableName, columns, conditions) {
    const whereClause = Object.keys(conditions)
      .map((col) => `${col} = ?`)
      .join(" AND ");
    const query = `SELECT ${columns.join(", ")} FROM ${tableName} WHERE ${whereClause}`;
    const values = Object.values(conditions);

    console.log("Executing query:", query, values);

    try {
      const result = await this.client.execute(query, values, { prepare: true });
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to retrieve records: ${error.message}`);
    }
  }

  /**
   * Update records in a table.
   * @param {string} tableName
   * @param {Object} updates
   * @param {Object} conditions
   */
  async updateRecord(tableName, updates, conditions) {
    const setClause = Object.keys(updates)
      .map((col) => `${col} = ?`)
      .join(", ");
    const whereClause = Object.keys(conditions)
      .map((col) => `${col} = ?`)
      .join(" AND ");

    const query = `UPDATE ${tableName} SET ${setClause} WHERE ${whereClause}`;
    const values = [...Object.values(updates), ...Object.values(conditions)];

    console.log("Executing query:", query, values);

    try {
      await this.client.execute(query, values, { prepare: true });
      console.log("✅ Record updated successfully");
    } catch (error) {
      throw new Error(`Failed to update record: ${error.message}`);
    }
  }

  /**
   * Delete records from a table.
   * @param {string} tableName
   * @param {Object} conditions
   */
  async deleteRecord(tableName, conditions) {
    const whereClause = Object.keys(conditions)
      .map((col) => `${col} = ?`)
      .join(" AND ");
    const query = `DELETE FROM ${tableName} WHERE ${whereClause}`;
    const values = Object.values(conditions);

    console.log("Executing query:", query, values);

    try {
      await this.client.execute(query, values, { prepare: true });
      console.log("✅ Record deleted successfully");
    } catch (error) {
      throw new Error(`Failed to delete record: ${error.message}`);
    }
  }

  async queryRecords(tableName, columns, conditions, values)  {
   
    const query = `SELECT ${columns.join(", ")} FROM ${tableName} WHERE ${conditions}`;
  
    console.log("Executing query:", query, values);
  
    try {
      const result = await this.client.execute(query, values, { prepare: true });
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to retrieve records: ${error.message}`);
    }
  }
}

module.exports = new ScyllaDBRepository(scyllaClient);
