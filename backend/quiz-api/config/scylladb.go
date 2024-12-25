package config

import (
	"fmt"
	"os"
	"strings"

	"github.com/gocql/gocql"
	"github.com/joho/godotenv"
)

type ScyllaConfig struct {
	Hosts             []string
	Keyspace          string
	Username          string
	Password          string
	ReplicationClass  string
	ReplicationFactor int
}

type ScyllaDB struct {
	Session *gocql.Session
}

var tableQueries = []string{
	`
    CREATE TABLE IF NOT EXISTS user_quizs (
		quiz_uuid UUID,
		score INT,
		user_uuid UUID,
		fullname TEXT,
		current_question_uuid UUID,
		created_at TIMESTAMP,
		updated_at TIMESTAMP,
		PRIMARY KEY (quiz_uuid, score, user_uuid)
	) WITH CLUSTERING ORDER BY (score DESC);`,
	`
    CREATE TABLE IF NOT EXISTS questions (
        quiz_uuid UUID,
        question_uuid UUID,
        prev_question_uuid UUID,
        next_question_uuid UUID,
		answers TEXT,
		score INT,
        PRIMARY KEY (quiz_uuid, question_uuid)
    );`,
	`
    CREATE TABLE IF NOT EXISTS user_answers (
        user_uuid UUID,
        question_uuid UUID,
        quiz_uuid UUID,
        answers TEXT,
        answer_time TIMESTAMP,
        PRIMARY KEY (user_uuid, question_uuid)
    );`,
	`
    CREATE TABLE IF NOT EXISTS quizs (
        quiz_uuid UUID PRIMARY KEY,
        question_uuid UUID,
        total_time INT
    );`,
	`CREATE MATERIALIZED VIEW IF NOT EXISTS user_quizs_by_user AS
    SELECT quiz_uuid, user_uuid, score, fullname, current_question_uuid, created_at, updated_at
    FROM user_quizs
    WHERE quiz_uuid IS NOT NULL AND user_uuid IS NOT NULL AND score IS NOT NULL
    PRIMARY KEY (user_uuid, quiz_uuid, score);`,
	`CREATE MATERIALIZED VIEW IF NOT EXISTS user_quizs_by_updated_at AS
	SELECT quiz_uuid, score, user_uuid, fullname, current_question_uuid, created_at, updated_at
	FROM user_quizs
	WHERE quiz_uuid IS NOT NULL AND score IS NOT NULL AND user_uuid IS NOT NULL AND updated_at IS NOT NULL
	PRIMARY KEY (quiz_uuid, score, updated_at, user_uuid)
	WITH CLUSTERING ORDER BY (score DESC, updated_at DESC);`,
}

func NewScyllaConfig() (*ScyllaConfig, error) {
	godotenv.Load()

	hosts := strings.Split(os.Getenv("SCYLLADB_HOSTS"), ",")
	keyspace := os.Getenv("SCYLLADB_KEYSPACE")
	username := os.Getenv("SCYLLADB_USERNAME")
	password := os.Getenv("SCYLLADB_PASSWORD")
	replicationClass := os.Getenv("SCYLLADB_REPLICATION_CLASS")
	replicationFactor := os.Getenv("SCYLLADB_REPLICATION_FACTOR")

	if replicationClass == "" {
		replicationClass = "SimpleStrategy"
	}
	replicationFactorValue := 1
	if replicationFactor != "" {
		fmt.Sscanf(replicationFactor, "%d", &replicationFactorValue)
	}

	if len(hosts) == 0 || keyspace == "" || username == "" || password == "" {
		return nil, fmt.Errorf("missing required configuration in .env file")
	}

	return &ScyllaConfig{
		Hosts:             hosts,
		Keyspace:          keyspace,
		Username:          username,
		Password:          password,
		ReplicationClass:  replicationClass,
		ReplicationFactor: replicationFactorValue,
	}, nil
}

func createKeySpace(session *gocql.Session, keyspace, strategy string, replicationFactor int) error {
	query := fmt.Sprintf(`
    CREATE KEYSPACE IF NOT EXISTS %s
    WITH replication = {'class': '%s', 'replication_factor': %d};
    `, keyspace, strategy, replicationFactor)

	fmt.Printf("Ensuring keyspace: %s with strategy: %s and replication factor: %d\n", keyspace, strategy, replicationFactor)
	if err := session.Query(query).Exec(); err != nil {
		return fmt.Errorf("failed to create keyspace %s: %v", keyspace, err)
	}
	fmt.Printf("Keyspace %s ensured.\n", keyspace)
	return nil
}

func createTables(session *gocql.Session, tableQueries []string) error {
	for _, query := range tableQueries {
		fmt.Printf("Ensuring table with query: %s\n", query)
		if err := session.Query(query).Exec(); err != nil {
			return fmt.Errorf("failed to execute query: %s, error: %v", query, err)
		}
		fmt.Println("Table ensured.")
	}
	return nil
}

func NewScyllaDB(cfg *ScyllaConfig) (*ScyllaDB, error) {
	cluster := gocql.NewCluster(cfg.Hosts...)
	cluster.Keyspace = "system"
	cluster.Consistency = gocql.Quorum
	cluster.Authenticator = gocql.PasswordAuthenticator{
		Username: cfg.Username,
		Password: cfg.Password,
	}

	session, err := cluster.CreateSession()
	if err != nil {
		return nil, fmt.Errorf("failed to connect to ScyllaDB: %v", err)
	}
	defer session.Close()

	if err := createKeySpace(session, cfg.Keyspace, cfg.ReplicationClass, cfg.ReplicationFactor); err != nil {
		return nil, err
	}

	cluster.Keyspace = cfg.Keyspace
	session, err = cluster.CreateSession()
	if err != nil {
		return nil, fmt.Errorf("failed to connect to keyspace %s: %v", cfg.Keyspace, err)
	}

	if err := createTables(session, tableQueries); err != nil {
		return nil, err
	}

	fmt.Println("Connected to ScyllaDB successfully")
	return &ScyllaDB{Session: session}, nil
}

func (db *ScyllaDB) Close() {
	db.Session.Close()
	fmt.Println("Closed ScyllaDB connection")
}
