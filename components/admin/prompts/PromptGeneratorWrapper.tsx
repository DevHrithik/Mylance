"use client";

import { useState } from "react";
import PromptGenerator from "./PromptGenerator";

interface UserWithDetails {
  id: string;
  email: string;
  first_name?: string | null;
  ideal_target_client?: string | null;
  client_pain_points?: string | null;
  unique_value_proposition?: string | null;
  proof_points?: string | null;
  energizing_topics?: string | null;
  decision_makers?: string | null;
  content_strategy?: string | null;
}

interface PromptGeneratorWrapperProps {
  users: UserWithDetails[];
}

export default function PromptGeneratorWrapper({
  users,
}: PromptGeneratorWrapperProps) {
  const [selectedUser, setSelectedUser] = useState<UserWithDetails | null>(
    null
  );

  return (
    <PromptGenerator
      selectedUser={selectedUser}
      onUserSelect={setSelectedUser}
      users={users}
    />
  );
}
