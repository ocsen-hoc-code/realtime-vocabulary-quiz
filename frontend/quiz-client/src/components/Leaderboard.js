import React from "react";

const Leaderboard = ({ scores }) => {
  return (
    <div className="container mt-5">
      <h2 className="mb-4 text-center text-primary">Leaderboard</h2>
      <table className="table table-striped table-hover text-center">
        <thead className="table-dark">
          <tr>
            <th>Rank</th>
            <th>Username</th>
            <th>Score</th>
          </tr>
        </thead>
        <tbody>
          {scores && scores.length > 0 ? (
            scores.map((user, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>{user.username}</td>
                <td>{user.score}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="3" className="text-muted">
                No scores available.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Leaderboard;
