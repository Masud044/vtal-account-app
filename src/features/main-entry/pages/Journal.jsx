import React from 'react';
import JournalTable from '../components/JournalTable';
import { SectionContainer } from '@/components/SectionContainer';

const Journal = () => {
  return (
    <SectionContainer>
      <div>
        <JournalTable />
      </div>
    </SectionContainer>
  );
};

export default Journal;