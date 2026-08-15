import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import { formatMinorToMajor } from "@/src/core/money";

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#121212",
    color: "#F5F5F5",
    fontSize: 10,
    padding: 32,
    fontFamily: "Helvetica",
  },
  kicker: {
    color: "#52D3FE",
    fontSize: 9,
    letterSpacing: 2,
    marginBottom: 6,
  },
  title: { fontSize: 18, marginBottom: 4 },
  muted: { color: "#A3A3A3", marginBottom: 16 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#2A2A2A",
    paddingVertical: 6,
  },
  mono: { fontFamily: "Courier" },
  section: { marginTop: 16 },
});

export type PdfSummary = {
  title: string;
  subtitle: string;
  rangeLabel: string;
  baseCurrency: string;
  incomeMinor: number;
  expenseMinor: number;
  netMinor: number;
  rows: Array<{ label: string; amountMinor: number }>;
};

function money(minor: number, currency: string) {
  return `${formatMinorToMajor(minor)} ${currency}`;
}

function SummaryDocument({ summary }: { summary: PdfSummary }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.kicker}>NOIRLY LEDGER</Text>
        <Text style={styles.title}>{summary.title}</Text>
        <Text style={styles.muted}>
          {summary.subtitle} · {summary.rangeLabel}
        </Text>
        <View style={styles.row}>
          <Text>Income</Text>
          <Text style={styles.mono}>
            {money(summary.incomeMinor, summary.baseCurrency)}
          </Text>
        </View>
        <View style={styles.row}>
          <Text>Expense</Text>
          <Text style={styles.mono}>
            {money(summary.expenseMinor, summary.baseCurrency)}
          </Text>
        </View>
        <View style={styles.row}>
          <Text>Net</Text>
          <Text style={styles.mono}>
            {money(summary.netMinor, summary.baseCurrency)}
          </Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.kicker}>BREAKDOWN</Text>
          {summary.rows.map((row) => (
            <View key={row.label} style={styles.row}>
              <Text>{row.label}</Text>
              <Text style={styles.mono}>
                {money(row.amountMinor, summary.baseCurrency)}
              </Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
}

export async function renderSummaryPdf(summary: PdfSummary): Promise<Buffer> {
  return renderToBuffer(<SummaryDocument summary={summary} />);
}
