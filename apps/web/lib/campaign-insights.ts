interface InsightMember {
  id: string;
  role: string;
  character: {
    id: string;
    name: string;
  } | null;
}

interface InsightQuest {
  id: string;
  title: string;
  status: string;
  priority: string;
}

interface InsightSession {
  id: string;
  number: number;
  title: string | null;
  status: string;
  date: string | null;
  publicRecap?: string | null;
  dmRecap?: string | null;
  attendance?: Array<{ characterId: string; name: string; status: string }> | null;
}

interface InsightPrompt {
  id: string;
  title: string;
  detail: string;
  tone: "warning" | "attention" | "info";
  icon: string;
}

interface SpotlightEntry {
  id: string;
  name: string;
  present: number;
  absent: number;
  partial: number;
  attendanceRate: number;
}

interface InsightCard {
  id: string;
  title: string;
  detail: string;
  icon: string;
}

interface DerivedCampaignInsights {
  spotlight: SpotlightEntry[];
  prepPrompts: InsightPrompt[];
  memoryCards: InsightCard[];
  stats: {
    activeQuests: number;
    completedSessions: number;
    openClocks: number;
    unresolvedMysteries: number;
    openPolls: number;
    craftingInProgress: number;
  };
}

function toArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function toStringList(value: unknown): string[] {
  return toArray<unknown>(value).map((entry) => String(entry).trim()).filter(Boolean);
}

function normalizeThreatClocks(value: unknown) {
  return toArray<unknown>(value)
    .map((entry, index) => {
      if (typeof entry === "string") {
        return { id: `clock-${index}`, title: entry, current: 0, max: 4, status: "active" };
      }
      if (!entry || typeof entry !== "object") return null;
      const item = entry as Record<string, unknown>;
      const title = String(item.title || item.name || "").trim();
      if (!title) return null;
      return {
        id: String(item.id || `clock-${index}`),
        title,
        current: Math.max(0, Number(item.current ?? item.progress ?? 0) || 0),
        max: Math.max(1, Number(item.max ?? item.total ?? 4) || 4),
        status: String(item.status || "active").toLowerCase(),
      };
    })
    .filter((entry): entry is { id: string; title: string; current: number; max: number; status: string } => Boolean(entry));
}

function normalizeMysteries(value: unknown) {
  return toArray<unknown>(value)
    .map((entry, index) => {
      if (typeof entry === "string") {
        return { id: `mystery-${index}`, title: entry, status: "open", notes: "" };
      }
      if (!entry || typeof entry !== "object") return null;
      const item = entry as Record<string, unknown>;
      const title = String(item.title || item.name || "").trim();
      if (!title) return null;
      return {
        id: String(item.id || `mystery-${index}`),
        title,
        status: String(item.status || "open").toLowerCase(),
        notes: String(item.notes || item.summary || "").trim(),
      };
    })
    .filter((entry): entry is { id: string; title: string; status: string; notes: string } => Boolean(entry));
}

function normalizeHandouts(value: unknown) {
  return toArray<unknown>(value)
    .map((entry, index) => {
      if (!entry || typeof entry !== "object") return null;
      const item = entry as Record<string, unknown>;
      const title = String(item.title || "").trim();
      if (!title) return null;
      return {
        id: String(item.id || `handout-${index}`),
        title,
        type: String(item.type || "handout").trim(),
        isPinned: Boolean(item.isPinned),
        visibility: item.visibility === "dm" ? "dm" : "public",
        createdAt: String(item.createdAt || new Date(0).toISOString()),
      };
    })
    .filter((entry): entry is { id: string; title: string; type: string; isPinned: boolean; visibility: "dm" | "public"; createdAt: string } => Boolean(entry));
}

function normalizeSchedulePolls(value: unknown) {
  return toArray<unknown>(value)
    .map((entry, index) => {
      if (!entry || typeof entry !== "object") return null;
      const item = entry as Record<string, unknown>;
      const title = String(item.title || "").trim();
      if (!title) return null;
      return {
        id: String(item.id || `poll-${index}`),
        title,
        status: item.status === "closed" ? "closed" : "open",
        options: toArray<unknown>(item.options)
          .map((option) => {
            if (!option || typeof option !== "object") return null;
            const record = option as Record<string, unknown>;
            return {
              votes: toArray<unknown>(record.votes).map((vote) => String(vote)),
            };
          })
          .filter((option): option is { votes: string[] } => Boolean(option)),
      };
    })
    .filter((entry): entry is { id: string; title: string; status: string; options: Array<{ votes: string[] }> } => Boolean(entry));
}

function normalizeCraftingProjects(value: unknown) {
  return toArray<unknown>(value)
    .map((entry, index) => {
      if (!entry || typeof entry !== "object") return null;
      const item = entry as Record<string, unknown>;
      const title = String(item.title || "").trim();
      if (!title) return null;
      return {
        id: String(item.id || `craft-${index}`),
        title,
        status: String(item.status || "planned").toLowerCase(),
        progress: Math.max(0, Math.min(100, Number(item.progress ?? 0) || 0)),
        dueDate: String(item.dueDate || "").trim(),
      };
    })
    .filter((entry): entry is { id: string; title: string; status: string; progress: number; dueDate: string } => Boolean(entry));
}

function formatDateLabel(value: string | null | undefined) {
  if (!value) return "No date set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No date set";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function deriveCampaignInsights(input: {
  members: InsightMember[];
  quests: InsightQuest[];
  sessions: InsightSession[];
  threatClocks: unknown;
  unresolvedMysteries: unknown;
  handouts: unknown;
  schedulePolls: unknown;
  craftingProjects: unknown;
  storyThreads: unknown;
  scheduledEvents: unknown;
}) : DerivedCampaignInsights {
  const players = input.members.filter((member) => member.role === "PLAYER" && member.character);
  const spotlightIndex = new Map(
    players.map((member) => [
      member.character!.id,
      {
        id: member.character!.id,
        name: member.character!.name,
        present: 0,
        absent: 0,
        partial: 0,
        attendanceRate: 0,
      },
    ])
  );

  for (const session of input.sessions) {
    const attendance = Array.isArray(session.attendance) ? session.attendance : [];
    for (const entry of attendance) {
      const target = spotlightIndex.get(entry.characterId);
      if (!target) continue;
      if (entry.status === "present") target.present += 1;
      else if (entry.status === "absent") target.absent += 1;
      else target.partial += 1;
    }
  }

  const spotlight = [...spotlightIndex.values()]
    .map((entry) => {
      const total = entry.present + entry.partial + entry.absent;
      return {
        ...entry,
        attendanceRate: total > 0 ? Math.round(((entry.present + entry.partial * 0.5) / total) * 100) : 0,
      };
    })
    .sort((a, b) => a.attendanceRate - b.attendanceRate || b.absent - a.absent || a.name.localeCompare(b.name));

  const activeQuests = input.quests.filter((quest) => quest.status === "ACTIVE");
  const highPriorityQuests = activeQuests.filter((quest) => quest.priority === "high");
  const completedSessions = input.sessions.filter((session) => session.status === "COMPLETED");
  const latestCompletedSession = completedSessions[0] ?? null;
  const threatClocks = normalizeThreatClocks(input.threatClocks);
  const openThreatClocks = threatClocks.filter((clock) => clock.status !== "resolved" && clock.current < clock.max);
  const pressingClock = [...openThreatClocks].sort((a, b) => b.current / b.max - a.current / a.max)[0] ?? null;
  const mysteries = normalizeMysteries(input.unresolvedMysteries).filter((entry) => entry.status !== "resolved");
  const pinnedHandouts = normalizeHandouts(input.handouts)
    .filter((entry) => entry.isPinned)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const openPolls = normalizeSchedulePolls(input.schedulePolls).filter((poll) => poll.status === "open");
  const craftingInProgress = normalizeCraftingProjects(input.craftingProjects);
  const overdueCrafting = craftingInProgress.filter(
    (project) =>
      project.status !== "complete" &&
      project.dueDate &&
      !Number.isNaN(new Date(project.dueDate).getTime()) &&
      new Date(project.dueDate).getTime() < Date.now()
  );
  const looseThreads = toStringList(input.storyThreads);
  const scheduledEvents = toStringList(input.scheduledEvents);

  const prepPrompts: InsightPrompt[] = [];

  if (highPriorityQuests.length > 0) {
    prepPrompts.push({
      id: "high-priority-quests",
      title: `${highPriorityQuests.length} high-priority quest${highPriorityQuests.length === 1 ? "" : "s"} active`,
      detail: highPriorityQuests.slice(0, 3).map((quest) => quest.title).join(" · "),
      tone: "attention",
      icon: "assignment_late",
    });
  }

  if (pressingClock) {
    prepPrompts.push({
      id: "pressing-clock",
      title: `Threat clock nearing resolution: ${pressingClock.title}`,
      detail: `${pressingClock.current}/${pressingClock.max} segments filled. Prep the next consequence beat.`,
      tone: "warning",
      icon: "timer",
    });
  }

  if (mysteries.length > 0) {
    prepPrompts.push({
      id: "mysteries",
      title: `${mysteries.length} unresolved mysteries remain open`,
      detail: mysteries.slice(0, 2).map((mystery) => mystery.title).join(" · "),
      tone: "attention",
      icon: "help",
    });
  }

  if (overdueCrafting.length > 0) {
    prepPrompts.push({
      id: "overdue-crafting",
      title: `${overdueCrafting.length} crafting project${overdueCrafting.length === 1 ? "" : "s"} overdue`,
      detail: overdueCrafting.slice(0, 2).map((project) => project.title).join(" · "),
      tone: "warning",
      icon: "construction",
    });
  }

  if (openPolls.length > 0) {
    prepPrompts.push({
      id: "open-polls",
      title: `${openPolls.length} scheduling poll${openPolls.length === 1 ? "" : "s"} still open`,
      detail: openPolls
        .slice(0, 2)
        .map((poll) => `${poll.title} (${poll.options.reduce((count, option) => count + option.votes.length, 0)} votes)`)
        .join(" · "),
      tone: "info",
      icon: "event_upcoming",
    });
  }

  if (scheduledEvents.length > 0) {
    prepPrompts.push({
      id: "scheduled-events",
      title: "Future events are already scheduled",
      detail: scheduledEvents.slice(0, 2).join(" · "),
      tone: "info",
      icon: "schedule",
    });
  }

  const lowSpotlight = spotlight.filter((entry) => entry.absent > 0 || entry.attendanceRate < 60).slice(0, 2);
  const memoryCards: InsightCard[] = [];

  if (latestCompletedSession) {
    memoryCards.push({
      id: "latest-session",
      title: `Last completed session: ${latestCompletedSession.title || `Session ${latestCompletedSession.number}`}`,
      detail: `Completed ${formatDateLabel(latestCompletedSession.date)}.${latestCompletedSession.publicRecap ? ` ${latestCompletedSession.publicRecap.slice(0, 120)}${latestCompletedSession.publicRecap.length > 120 ? "..." : ""}` : " No player recap has been published yet."}`,
      icon: "history",
    });
  }

  if (pinnedHandouts.length > 0) {
    memoryCards.push({
      id: "pinned-handouts",
      title: `${pinnedHandouts.length} pinned handout${pinnedHandouts.length === 1 ? "" : "s"} worth resurfacing`,
      detail: pinnedHandouts.slice(0, 3).map((handout) => handout.title).join(" · "),
      icon: "collections_bookmark",
    });
  }

  if (looseThreads.length > 0) {
    memoryCards.push({
      id: "loose-threads",
      title: "Loose threads still hanging",
      detail: looseThreads.slice(0, 3).join(" · "),
      icon: "lan",
    });
  }

  if (lowSpotlight.length > 0) {
    memoryCards.push({
      id: "spotlight-reminder",
      title: "Players at risk of missing spotlight",
      detail: lowSpotlight.map((entry) => `${entry.name} (${entry.attendanceRate}% attendance)`).join(" · "),
      icon: "visibility",
    });
  }

  return {
    spotlight,
    prepPrompts,
    memoryCards,
    stats: {
      activeQuests: activeQuests.length,
      completedSessions: completedSessions.length,
      openClocks: openThreatClocks.length,
      unresolvedMysteries: mysteries.length,
      openPolls: openPolls.length,
      craftingInProgress: craftingInProgress.filter((project) => project.status !== "complete").length,
    },
  };
}
