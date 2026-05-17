import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import "./StudentRanking.css";

interface Student {
  id: string;
  name: string;
  grade: string;
  assignments_submitted: number;
  photo_url: string | null;
  total_points?: number;
  rank?: number;
}

export default function StudentRanking() {
  const [students, setStudents] = useState<Student[]>([]);

  useEffect(() => {
    fetchRankings();
  }, []);

  async function fetchRankings() {
    const { data, error } = await supabase
      .from("student_rankings")
      .select("*");

    if (error) {
      console.error(error);
      return;
    }

    const ranked = (data as Student[])
      .map((student) => ({
        ...student,
        total_points: student.assignments_submitted * 10,
      }))
      .sort((a, b) => {
        if ((b.total_points ?? 0) !== (a.total_points ?? 0)) {
          return (b.total_points ?? 0) - (a.total_points ?? 0);
        }

        return a.name.localeCompare(b.name);
      })
      .map((student, index, arr) => {
        const previous = arr[index - 1];

        const rank =
          previous &&
          previous.total_points === student.total_points
            ? previous.rank
            : index + 1;

        return { ...student, rank };
      });

    setStudents(ranked);
  }

  return (
    <main className="student-ranking-page">
      <h1>Student Ranking</h1>

      <div className="ranking-box">
        <table className="ranking-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Photo</th>
              <th>Name</th>
              <th>Grade</th>
              <th>Assignments Completed</th>
              <th>Total Points Achieved</th>
            </tr>
          </thead>

          <tbody>
            {students.map((student) => (
              <tr key={student.id}>
                <td>{student.rank}</td>

                <td>
                  {student.photo_url ? (
                    <img
                      src={student.photo_url}
                      alt={student.name}
                      className="student-photo"
                    />
                  ) : (
                    <div className="no-photo">No Photo</div>
                  )}
                </td>

                <td>{student.name}</td>
                <td>{student.grade}</td>
                <td>{student.assignments_submitted}</td>
                <td>{student.total_points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}