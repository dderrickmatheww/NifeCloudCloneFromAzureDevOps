const testLocally = process.env.LocalTesting == "true";

const postEmailTemplate = ({ columns, values }) => {
    return ({
        from: `Nife Firebase Cloud Functions <${process.env.EMAIL}>`,
        to: `${process.env.TOEMAIL}`,
        subject: 'Business Verification', // email subject
        html: `<p style="font-size: 16px;">Businesses that need verified</p>
            <br />
            <table style="font-family: Arial, Helvetica, sans-serif; border-collapse: collapse; width: 100%;">
                <tr>
                    ${columns.map((column, index) => {
                        return `<th style="padding-top: 12px; padding-bottom: 12px; text-align: left; background-color: #4B0082; color: white; border: 1px solid #ddd; padding: 8px;">${ column }</th>`
                    })}
                </tr>
                ${values.map((value, index) => {
                    return `<tr>
                        <td style="border: 1px solid #ddd; padding: 8px;">${value.userId}</td>
                        <td style="border: 1px solid #ddd; padding: 8px;">${value.postId}</td>
                        <td style="border: 1px solid #ddd; padding: 8px;">${value.description}</td>
                        <td style="border: 1px solid #ddd; padding: 8px;">${value.image}</td>
                        <td style="border: 1px solid #ddd; padding: 8px;">${value.created}</td>
                        <td style="border: 1px solid #ddd; padding: 8px;"><a href="${testLocally ? 'http://localhost:8080' : 'https://us-central1-nife-75d60.cloudfunctions.net'}/deletePostById?postId=${value.postId}">Delete</a></td>
                    </tr>`
                }).join(' ')}
            </table>`
    });
}

const businessEmailTemplate = ({ columns, values }) => {
    return ({
        from: `Nife Firebase Cloud Functions <${process.env.EMAIL}>`,
        to: `${process.env.TOEMAIL}`,
        subject: 'Business Verification', // email subject
        html: `<p style="font-size: 16px;">Businesses that need verified</p>
            <br />
            <table style="font-family: Arial, Helvetica, sans-serif; border-collapse: collapse; width: 100%;">
                <tr>
                    ${columns.map((column, index) => {
                        return `<th style="padding-top: 12px; padding-bottom: 12px; text-align: left; background-color: #4B0082; color: white; border: 1px solid #ddd; padding: 8px;">${ column }</th>`
                    })}
                </tr>
                ${values.map((value, index) => {
                    return `<tr>
                        <td style="border: 1px solid #ddd; padding: 8px;">${value.userId}</td>
                        <td style="border: 1px solid #ddd; padding: 8px;">${value.uuid}</td>
                        <td style="border: 1px solid #ddd; padding: 8px;">${value.lastModified}</td>
                        <td style="border: 1px solid #ddd; padding: 8px;">${value.created}</td>
                        <td style="border: 1px solid #ddd; padding: 8px;">${value.email}</td>
                        <td style="border: 1px solid #ddd; padding: 8px;">${value.displayName}</td>
                        <td style="border: 1px solid #ddd; padding: 8px;">${value.phoneNumber}</td>
                        <td style="border: 1px solid #ddd; padding: 8px;">${value.latitude}</td>
                        <td style="border: 1px solid #ddd; padding: 8px;">${value.longitude}</td>
                        <td style="border: 1px solid #ddd; padding: 8px;">${value.ownerName}</td>
                        <td style="border: 1px solid #ddd; padding: 8px;">${value.photoSource}</td>
                        <td style="border: 1px solid #ddd; padding: 8px;">${value.lastLogin}</td>
                        <td style="border: 1px solid #ddd; padding: 8px;">${value.businessId}</td>
                        <td style="border: 1px solid #ddd; padding: 8px;">${value.street}</td>
                        <td style="border: 1px solid #ddd; padding: 8px;">${value.city}</td>
                        <td style="border: 1px solid #ddd; padding: 8px;">${value.state}</td>
                        <td style="border: 1px solid #ddd; padding: 8px;">${value.zip}</td>
                        <td style="border: 1px solid #ddd; padding: 8px;">${value.country}</td>
                        <td style="border: 1px solid #ddd; padding: 8px;"><a href="${value.proofOfAddress}">Proof Of Address</a></td>
                        <td style="border: 1px solid #ddd; padding: 8px;">${value.verified}</td>
                        <td style="border: 1px solid #ddd; padding: 8px;"><a href="${testLocally ? 'http://localhost:8080' : 'https://us-central1-nife-75d60.cloudfunctions.net'}/verifyBusiness?uuid=${value.uuid}">Verify</a></td>
                    </tr>`
                }).join(' ')}
            </table>`
    });
}

module.exports = {
    businessEmailTemplate,
    postEmailTemplate
}