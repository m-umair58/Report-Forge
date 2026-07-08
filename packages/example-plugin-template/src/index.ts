import { definePlugin } from '@reportforge/plugin-sdk';

export interface MeetingNotesConfig {
  readonly companyName?: string;
}

export const MeetingNotesTemplatePlugin = definePlugin<MeetingNotesConfig>({
  id: 'example-plugin-template',
  name: 'Meeting Notes Template',
  version: '1.0.0',
  description: 'Registers a reusable meeting notes template.',
  author: 'ReportForge',
  license: 'MIT',
  keywords: ['template'],
  register(app) {
    app.templates.register({
      id: 'meeting-notes',
      name: 'Meeting Notes',
      description: 'Simple meeting notes layout.',
      build(builder, data) {
        const report = builder as unknown as {
          title(text: string): void;
          paragraph(text: string): void;
          section(label: string, fn: (section: { paragraph(text: string): void }) => void): void;
        };
        report.title(String(data['title'] ?? 'Meeting Notes'));
        report.paragraph(`Date: ${String(data['date'] ?? '')}`);
        report.paragraph(`Attendees: ${String(data['attendees'] ?? '')}`);
        report.section('Notes', (section) => {
          section.paragraph(String(data['notes'] ?? ''));
        });
      },
    });
  },
});

export default MeetingNotesTemplatePlugin;
