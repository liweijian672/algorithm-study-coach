import { useEffect, useState } from "react";

import { api } from "../api";
import type { DiagnosisOut, TopicMastery } from "../types";
import { formatMastery } from "../utils";

export default function Topic({ tagId }: { tagId: number }) {
  const [topic, setTopic] = useState<TopicMastery | null>(null);

  useEffect(() => {
    void api
      .getDiagnosis()
      .then((diagnosis: DiagnosisOut) => {
        setTopic(
          diagnosis.tag_mastery.find((item) => item.tag_id === tagId) ?? null,
        );
      })
      .catch(() => setTopic(null));
  }, [tagId]);

  if (!topic) return <div className="text-sm text-slate-500">暂无数据</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold">{topic.display_name}</h2>
      <div className="rounded-md bg-white p-4 shadow-sm">
        <span className="text-sm text-slate-500">当前掌握度</span>
        <p className="mt-1 text-2xl font-semibold">
          {formatMastery(topic.mastery)}
        </p>
      </div>
    </div>
  );
}

