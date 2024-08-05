import Link from 'next/link';
import Highlighted from '@/components/Highlighted';
import { getRecords } from '@/app/name/util';

type Props = {params: {name: string}};

export default async function ReportByName({
  params: {name: encodedName},
}: Props) {
  const name = decodeURIComponent(encodedName).trim();
  const [directHits, ftsHits] = await getRecords(name);

  return <>
    {
      directHits.length === 0 ? `The name ${name} is not reported by 165 yet.` :
      <>
        The name “{name}” is used by the following know scam sites.
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>URL</th>
              <th>Count</th>
              <th>Start Date</th>
              <th>End Date</th>
            </tr>
          </thead>
          <tbody>
            {directHits.map((record) => (
              <tr key={record.id}>
                <td>{record.name}</td>
                <td><Link href={`/host/${record.host}`}>{record.url}</Link></td>
                <td>{record.count}</td>
                <td>{record.startDate}</td>
                <td>{record.endDate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </>
    }

    <h2>Similar entries on 165</h2>
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>網域</th>
          <th>Reported</th>
        </tr>
      </thead>
      <tbody>
        {ftsHits.map((record) => (
          <tr key={record.rowid}>
            <td>
              <Link href={`/name/${record.nameTokens.join('')}`}>
                <Highlighted tokens={record.nameTokens} />
              </Link>
            </td>
            <td>
              <Link href={`/host/${record.hostTokens.join('')}`}>
                <Highlighted tokens={record.hostTokens} />
              </Link>
            </td>
            <td>{record.count} time(s) during {record.startDate} and {record.endDate}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </>;
}