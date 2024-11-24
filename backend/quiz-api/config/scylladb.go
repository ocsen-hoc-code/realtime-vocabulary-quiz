package config

import (
	"fmt"
	"os"
	"strings"

	"github.com/gocql/gocql"
	"github.com/joho/godotenv"
)

type ScyllaConfig struct {
	Hosts    []string
	Keyspace string
	Username string
	Password string
}

type ScyllaDB struct {
	Session *gocql.Session
}

func NewScyllaConfig() (*ScyllaConfig, error) {
	godotenv.Load()

	hosts := strings.Split(os.Getenv("SCYLLADB_HOSTS"), ",")
	keyspace := os.Getenv("SCYLLADB_KEYSPACE")
	username := os.Getenv("SCYLLADB_USERNAME")
	password := os.Getenv("SCYLLADB_PASSWORD")

	if len(hosts) == 0 || keyspace == "" || username == "" || password == "" {
		return nil, fmt.Errorf("Missing configuration in .env file")
	}

	return &ScyllaConfig{
		Hosts:    hosts,
		Keyspace: keyspace,
		Username: username,
		Password: password,
	}, nil
}

func NewScyllaDB(cfg *ScyllaConfig) (*ScyllaDB, error) {
	cluster := gocql.NewCluster(cfg.Hosts...)
	cluster.Keyspace = cfg.Keyspace
	cluster.Consistency = gocql.Quorum
	cluster.Authenticator = gocql.PasswordAuthenticator{
		Username: cfg.Username,
		Password: cfg.Password,
	}

	session, err := cluster.CreateSession()
	if err != nil {
		return nil, fmt.Errorf("failed to connect to ScyllaDB: %v", err)
	}

	fmt.Println("Connected to ScyllaDB successfully")
	return &ScyllaDB{Session: session}, nil
}

func (db *ScyllaDB) Close() {
	db.Session.Close()
	fmt.Println("Closed ScyllaDB connection")
}
