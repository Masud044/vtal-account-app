// src/components/shared/empty-state.jsx

import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";

import {
  TableRow,
  TableCell,
} from "@/components/ui/table";

function EmptyState({ icon: Icon, title, description }) {
  return (
    <Empty>
      <EmptyHeader>
        {Icon && (
          <EmptyMedia variant="icon">
            <Icon />
          </EmptyMedia>
        )}

        <EmptyTitle>{title}</EmptyTitle>

        {description && (
          <EmptyDescription>
            {description}
          </EmptyDescription>
        )}
      </EmptyHeader>
    </Empty>
  );
}

function TableEmptyState({ colSpan, icon, title, description }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="h-32 text-center">
        <EmptyState
          icon={icon}
          title={title}
          description={description}
        />
      </TableCell>
    </TableRow>
  );
}

export { EmptyState, TableEmptyState };