import React from "react";

const Leaderboard = ({ scores }) => {
  return (
    <div className="leaderboard-container">
      <h2 className="text-center text-primary">Leaderboard</h2>
      <div className="leaderboard">
        <table className="table table-bordered table-hover text-center">
          <thead className="table-primary">
            <tr>
              <th style={{ width: "10%" }}>Rank</th>
              <th style={{ width: "50%" }}>Full Name</th>
              <th style={{ width: "20%" }}>Score</th>
            </tr>
          </thead>
          <tbody>
            {scores && scores.length > 0 ? (
              scores.map((user, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{user.fullname}</td>
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
    </div>
  );
};

export default Leaderboard;
