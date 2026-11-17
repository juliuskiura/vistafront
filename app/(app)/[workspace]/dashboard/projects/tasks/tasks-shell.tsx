interface TasksLayoutProps {
  children: React.ReactNode;
  workspaceDomain: string;
}

export function TasksLayout({ children }: TasksLayoutProps) {
  return <div className="flex min-h-full flex-col">{children}</div>;
}
