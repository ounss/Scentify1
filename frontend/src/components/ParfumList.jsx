import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import ParfumCard from "./ParfumCard";

export default function ParfumList() {
  const [parfums, setParfums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const search = searchParams.get("search");

  useEffect(() => {
    const url = search ? `/api/parfums/search?query=${search}` : "/api/parfums";

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setParfums(data);
        setLoading(false);
      });
  }, [search]);

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div className="parfum-grid">
      {parfums.map((parfum) => (
        <ParfumCard key={parfum._id} parfum={parfum} />
      ))}
    </div>
  );
}
