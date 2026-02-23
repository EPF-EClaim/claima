const cds = require('@sap/cds');
const { INSERT, UPDATE, UPSERT } = require('@sap/cds/lib/ql/cds-ql');

module.exports = (srv)=>{
  const{ ZEMP_MASTER} = srv.entities;

  srv.on('batchCreateEmployee', async(req) => {
    try {
      const { employees } = req.data;
      if(!employees || employees.length === 0) {
        throw new Error('No Data Sent')
      }
      const tx = cds.tx(req);
      
      // for(const employee of employees){
      //   const exist = await tx.read(ZEMP_MASTER).where({EEID: employee.EEID});
      //   if (exist.length > 0){
          // throw new Error(`Duplicate Entry ${employee.EEID}`);
          // UPDATE.entity(ZEMP_MASTER).data(employee)
      //   }
      // }
      const results = await tx.run(
        // INSERT.into(ZEMP_MASTER).entries(employees)
        UPSERT (employees) .into (ZEMP_MASTER)
      );
      return 'Records updated';
    } catch (error) {
      req.error(400, `Fail creating record: ${error.message}` );
    }
  })
}