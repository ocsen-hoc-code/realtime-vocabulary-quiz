package repositories

import (
	"fmt"
	"log"
	"quiz-api/config"
	"strings"

	"github.com/gocql/gocql"
)

type ScyllaDBRepository struct {
	Session *gocql.Session
}

func NewScyllaDBRepository(scyllaDB *config.ScyllaDB) *ScyllaDBRepository {
	return &ScyllaDBRepository{Session: scyllaDB.Session}
}

// InsertRecord inserts a record into the specified table.
func (repo *ScyllaDBRepository) InsertRecord(tableName string, data map[string]interface{}, columns []string) error {
	if len(data) == 0 {
		return fmt.Errorf("no data to insert")
	}

	keys := strings.Join(columns, ", ")
	placeholders := strings.Repeat("?, ", len(columns)-1) + "?"
	values := make([]interface{}, len(columns))

	for i, col := range columns {
		if val, ok := data[col]; ok {
			values[i] = val
		} else {
			values[i] = nil
		}
	}

	query := fmt.Sprintf("INSERT INTO %s (%s) VALUES (%s)", escape(tableName), keys, placeholders)

	log.Printf("Executing query: %s, with values: %v", query, values)

	if err := repo.Session.Query(query, values...).Exec(); err != nil {
		return fmt.Errorf("failed to insert record: %w", err)
	}
	return nil
}

// SelectRecords fetches records from the specified table based on conditions.
func (repo *ScyllaDBRepository) SelectRecords(tableName string, columns []string, conditions map[string]interface{}, orderBy string, limit int) ([]map[string]interface{}, error) {
	query := fmt.Sprintf("SELECT %s FROM %s WHERE %s", columnList(columns), escape(tableName), conditionList(conditions))
	if orderBy != "" {
		query += fmt.Sprintf(" ORDER BY %s", escape(orderBy))
	}
	if limit > 0 {
		query += fmt.Sprintf(" LIMIT %d", limit)
	}

	log.Printf("Executing query: %s, with conditions: %v", query, conditions)
	iter := repo.Session.Query(query, conditionValues(conditions)...).Iter()

	result := []map[string]interface{}{}
	for {
		row := map[string]interface{}{}
		if !iter.MapScan(row) {
			break
		}
		result = append(result, row)
	}

	if err := iter.Close(); err != nil {
		return nil, fmt.Errorf("failed to retrieve records: %w", err)
	}
	return result, nil
}

// UpdateRecord updates records in the specified table based on conditions.
func (repo *ScyllaDBRepository) UpdateRecord(tableName string, updates map[string]interface{}, conditions map[string]interface{}) error {
	if len(updates) == 0 {
		return fmt.Errorf("no updates specified")
	}

	query := fmt.Sprintf("UPDATE %s SET %s WHERE %s", escape(tableName), updateList(updates), conditionList(conditions))
	values := append(values(updates), conditionValues(conditions)...)

	log.Printf("Executing query: %s, with values: %v", query, values)
	if err := repo.Session.Query(query, values...).Exec(); err != nil {
		return fmt.Errorf("failed to update record: %w", err)
	}
	return nil
}

// DeleteRecord deletes records from the specified table based on conditions.
func (repo *ScyllaDBRepository) DeleteRecord(tableName string, conditions map[string]interface{}) error {
	if len(conditions) == 0 {
		return fmt.Errorf("no conditions specified for delete")
	}

	query := fmt.Sprintf("DELETE FROM %s WHERE %s", escape(tableName), conditionList(conditions))
	log.Printf("Executing query: %s, with conditions: %v", query, conditions)

	if err := repo.Session.Query(query, conditionValues(conditions)...).Exec(); err != nil {
		return fmt.Errorf("failed to delete records: %w", err)
	}
	return nil
}

// Helper Functions

func keys(data map[string]interface{}) string {
	keyList := []string{}
	for key := range data {
		keyList = append(keyList, fmt.Sprintf("\"%s\"", key))
	}
	return strings.Join(keyList, ", ")
}

func placeholders(n int) string {
	ph := make([]string, n)
	for i := range ph {
		ph[i] = "?"
	}
	return strings.Join(ph, ", ")
}

func values(data map[string]interface{}) []interface{} {
	valList := []interface{}{}
	for _, val := range data {
		valList = append(valList, val)
	}
	return valList
}

func columnList(columns []string) string {
	escapedCols := []string{}
	for _, col := range columns {
		escapedCols = append(escapedCols, escape(col))
	}
	return strings.Join(escapedCols, ", ")
}

func updateList(updates map[string]interface{}) string {
	parts := []string{}
	for key := range updates {
		parts = append(parts, fmt.Sprintf("%s = ?", escape(key)))
	}
	return strings.Join(parts, ", ")
}

func conditionList(conditions map[string]interface{}) string {
	parts := []string{}
	for key := range conditions {
		parts = append(parts, fmt.Sprintf("%s = ?", escape(key)))
	}
	return strings.Join(parts, " AND ")
}

func conditionValues(conditions map[string]interface{}) []interface{} {
	valList := []interface{}{}
	for _, val := range conditions {
		valList = append(valList, val)
	}
	return valList
}

func escape(identifier string) string {
	return fmt.Sprintf("\"%s\"", identifier)
}
