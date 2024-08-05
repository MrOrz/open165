import Link from 'next/link';
import { getRecords } from '@/app/host/util';
import Highlighted from '@/components/Highlighted';

export const runtime = 'edge';

export default async function Host({params: {host}}: {params: {host: string}}) {
  const [directHits, ftsHits] = await getRecords(host);
  const totalReportCount = directHits.reduce((sum, record) => sum + record.count, 0)

  return (
    <>
      {
        totalReportCount === 0 ?
        `${host} is not reported by 165 yet.` :
        <>
          {host} is a confirmed scam by 165. It has been reported {totalReportCount} times.
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
                  <td><Link href={`/name/${record.name}`}>{record.name}</Link></td>
                  <td>{record.url}</td>
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
    </>
  )
}
